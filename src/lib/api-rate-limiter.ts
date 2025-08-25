import { prisma } from './prisma';

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

interface ApiUsageStats {
  endpoint: string;
  method: string;
  userId?: string;
  count: number;
  period: string;
  lastUsed: Date;
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private usageCache: Map<string, { count: number; reset: Date }> = new Map();

  static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  // API使用量をチェックして制限を適用
  async checkRateLimit(
    identifier: string,
    endpoint: string,
    method: string = 'GET',
    limitPerHour: number = 100
  ): Promise<RateLimitResult> {
    const now = new Date();
    const key = `${identifier}:${endpoint}:${method}`;
    
    // キャッシュから現在の使用量を取得
    let usage = this.usageCache.get(key);
    
    // リセット時刻を計算（現在時刻から1時間後）
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (!usage || usage.reset < now) {
      // 新しい時間枠を開始
      usage = {
        count: 0,
        reset: resetTime
      };
    }

    // システム設定から制限値を取得
    const customLimit = await this.getCustomRateLimit(endpoint);
    const actualLimit = customLimit || limitPerHour;

    // 使用量を増加
    usage.count++;
    this.usageCache.set(key, usage);

    // データベースに記録
    await this.recordApiUsage(identifier, endpoint, method);

    const remaining = Math.max(0, actualLimit - usage.count);
    const allowed = usage.count <= actualLimit;

    if (!allowed) {
      // レート制限に達した場合、通知を作成
      await this.createRateLimitNotification(identifier, endpoint, actualLimit);
    }

    return {
      allowed,
      limit: actualLimit,
      remaining,
      reset: usage.reset,
      retryAfter: allowed ? undefined : Math.ceil((usage.reset.getTime() - now.getTime()) / 1000)
    };
  }

  // カスタムレート制限をシステム設定から取得
  private async getCustomRateLimit(endpoint: string): Promise<number | null> {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'api_rate_limit' }
      });

      if (setting) {
        return parseInt(setting.value);
      }

      // エンドポイント固有の設定を確認
      const endpointKey = `api_rate_limit_${endpoint.replace(/\//g, '_')}`;
      const endpointSetting = await prisma.systemSettings.findUnique({
        where: { key: endpointKey }
      });

      if (endpointSetting) {
        return parseInt(endpointSetting.value);
      }

      return null;
    } catch (error) {
      console.error('Failed to get custom rate limit:', error);
      return null;
    }
  }

  // API使用量を記録
  private async recordApiUsage(
    identifier: string,
    endpoint: string,
    method: string
  ) {
    try {
      // 管理ログに記録
      await prisma.adminLog.create({
        data: {
          action: 'api_usage',
          details: JSON.stringify({
            identifier,
            endpoint,
            method,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      console.error('Failed to record API usage:', error);
    }
  }

  // レート制限通知を作成
  private async createRateLimitNotification(
    identifier: string,
    endpoint: string,
    limit: number
  ) {
    try {
      // 既存の未読通知があるか確認
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'warning',
          category: 'api',
          isRead: false,
          title: 'API制限警告',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // 1時間以内
          }
        }
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: 'API制限警告',
            message: `${identifier} が ${endpoint} のAPI制限（${limit}回/時）に達しました`,
            type: 'warning',
            priority: 'high',
            category: 'api'
          }
        });
      }
    } catch (error) {
      console.error('Failed to create rate limit notification:', error);
    }
  }

  // API使用統計を取得
  async getUsageStatistics(
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<ApiUsageStats[]> {
    try {
      let startDate = new Date();
      
      switch (period) {
        case 'hour':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const logs = await prisma.adminLog.findMany({
        where: {
          action: 'api_usage',
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 集計
      const statsMap = new Map<string, ApiUsageStats>();
      
      logs.forEach(log => {
        if (log.details) {
          try {
            const details = JSON.parse(log.details);
            const key = `${details.endpoint}:${details.method}`;
            
            const existing = statsMap.get(key) || {
              endpoint: details.endpoint,
              method: details.method,
              userId: details.identifier,
              count: 0,
              period,
              lastUsed: log.createdAt
            };
            
            existing.count++;
            if (log.createdAt > existing.lastUsed) {
              existing.lastUsed = log.createdAt;
            }
            
            statsMap.set(key, existing);
          } catch (e) {
            console.error('Failed to parse log details:', e);
          }
        }
      });

      return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      return [];
    }
  }

  // トークン使用量を追跡
  async trackTokenUsage(
    userId: string,
    tokens: number,
    model: string = 'gemini-1.5-flash'
  ): Promise<boolean> {
    try {
      // 1日のトークン制限を取得
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'max_tokens_per_day' }
      });
      
      const maxTokensPerDay = setting ? parseInt(setting.value) : 50000;
      
      // 今日の使用量を計算
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsage = await prisma.aIGeneration.aggregate({
        where: {
          userId,
          createdAt: { gte: today }
        },
        _sum: { tokensUsed: true }
      });
      
      const currentUsage = Number(todayUsage._sum.tokensUsed) || 0;
      const newTotal = currentUsage + tokens;
      
      if (newTotal > maxTokensPerDay) {
        // トークン制限に達した
        await prisma.notification.create({
          data: {
            title: 'トークン制限警告',
            message: `本日のAI生成トークン制限（${maxTokensPerDay.toLocaleString()}トークン）に達しました`,
            type: 'error',
            priority: 'urgent',
            category: 'api',
            userId
          }
        });
        
        return false;
      }
      
      // 80%を超えたら警告
      if (currentUsage < maxTokensPerDay * 0.8 && newTotal >= maxTokensPerDay * 0.8) {
        await prisma.notification.create({
          data: {
            title: 'トークン使用量警告',
            message: `本日のトークン使用量が制限の80%（${Math.floor(maxTokensPerDay * 0.8).toLocaleString()}トークン）を超えました`,
            type: 'warning',
            priority: 'high',
            category: 'api',
            userId
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to track token usage:', error);
      return true; // エラーの場合は通過させる
    }
  }

  // API使用量サマリーを取得
  async getUsageSummary(userId?: string) {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // API呼び出し数
      const whereClause = userId ? { userId, createdAt: { gte: hourAgo } } : { createdAt: { gte: hourAgo } };
      
      const hourlyApiCalls = await prisma.adminLog.count({
        where: {
          action: 'api_usage',
          createdAt: { gte: hourAgo }
        }
      });
      
      const dailyApiCalls = await prisma.adminLog.count({
        where: {
          action: 'api_usage',
          createdAt: { gte: dayAgo }
        }
      });
      
      // トークン使用量
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tokenUsage = await prisma.aIGeneration.aggregate({
        where: userId ? { userId, createdAt: { gte: today } } : { createdAt: { gte: today } },
        _sum: { tokensUsed: true },
        _count: { id: true }
      });
      
      // 制限値を取得
      const [apiLimitSetting, tokenLimitSetting] = await Promise.all([
        prisma.systemSettings.findUnique({ where: { key: 'api_rate_limit' } }),
        prisma.systemSettings.findUnique({ where: { key: 'max_tokens_per_day' } })
      ]);
      
      const apiLimit = apiLimitSetting ? parseInt(apiLimitSetting.value) : 100;
      const tokenLimit = tokenLimitSetting ? parseInt(tokenLimitSetting.value) : 50000;
      
      return {
        api: {
          hourly: {
            used: hourlyApiCalls,
            limit: apiLimit,
            remaining: Math.max(0, apiLimit - hourlyApiCalls),
            percentage: (hourlyApiCalls / apiLimit) * 100
          },
          daily: {
            used: dailyApiCalls,
            limit: apiLimit * 24,
            remaining: Math.max(0, apiLimit * 24 - dailyApiCalls),
            percentage: (dailyApiCalls / (apiLimit * 24)) * 100
          }
        },
        tokens: {
          used: Number(tokenUsage._sum.tokensUsed) || 0,
          limit: tokenLimit,
          remaining: Math.max(0, tokenLimit - (Number(tokenUsage._sum.tokensUsed) || 0)),
          percentage: ((Number(tokenUsage._sum.tokensUsed) || 0) / tokenLimit) * 100,
          generations: Number(tokenUsage._count.id) || 0
        },
        timestamp: now.toISOString()
      };
    } catch (error) {
      console.error('Failed to get usage summary:', error);
      return null;
    }
  }

  // キャッシュをクリア（メンテナンス用）
  clearCache() {
    this.usageCache.clear();
    console.log('🧹 API rate limiter cache cleared');
  }
}

// エクスポート
export const apiRateLimiter = ApiRateLimiter.getInstance();