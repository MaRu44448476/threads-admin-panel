import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimiter } from './api-rate-limiter';
import { prisma } from './prisma';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const {
    maxRequests = 100,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = options;

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // キーを生成（IPアドレス + ユーザーエージェントのハッシュ）
      const identifier = keyGenerator(request);
      const endpoint = new URL(request.url).pathname;
      const method = request.method;

      // レート制限をチェック
      const rateLimitResult = await apiRateLimiter.checkRateLimit(
        identifier,
        endpoint,
        method,
        maxRequests
      );

      // レスポンスヘッダーを設定
      const response = rateLimitResult.allowed
        ? await handler()
        : new NextResponse(
            JSON.stringify({
              error: 'Too Many Requests',
              message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
              retryAfter: rateLimitResult.retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

      // レート制限ヘッダーを追加
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString());
      
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
      }

      return response;

    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // エラーが発生した場合は元のハンドラーを実行
      return await handler();
    }
  };
}

// デフォルトのキー生成関数
function defaultKeyGenerator(request: NextRequest): string {
  // IPアドレスを取得（プロキシ経由の場合も考慮）
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') ||
             'unknown';
  
  // User-Agentを取得
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // 認証情報があれば使用（Basic認証の場合）
  const auth = request.headers.get('authorization');
  if (auth) {
    return `auth:${auth.substring(0, 20)}`; // 先頭20文字のみ使用
  }

  return `${ip}:${userAgent.substring(0, 50)}`;
}

// APIエンドポイント用のレート制限デコレータ
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const middleware = createRateLimitMiddleware(options);
  
  return async function (request: NextRequest) {
    return await middleware(request, () => handler(request));
  };
}

// 特定のエンドポイント用のプリセット
export const rateLimitPresets = {
  // 一般的なAPI（100回/時間）
  standard: {
    maxRequests: 100
  },
  
  // 重いAPI（20回/時間）
  heavy: {
    maxRequests: 20
  },
  
  // 軽いAPI（300回/時間）
  light: {
    maxRequests: 300
  },
  
  // 認証API（5回/時間）
  auth: {
    maxRequests: 5
  },
  
  // AI生成API（50回/時間）
  ai: {
    maxRequests: 50
  }
};

// トークン使用量をチェックするミドルウェア
export function createTokenLimitMiddleware() {
  return async function tokenLimitMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>,
    userId: string,
    estimatedTokens: number = 0
  ): Promise<NextResponse> {
    try {
      // トークン使用量をチェック
      const allowed = await apiRateLimiter.trackTokenUsage(
        userId,
        estimatedTokens
      );

      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Token Limit Exceeded',
            message: 'Daily token limit has been reached. Please try again tomorrow.'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      return await handler();

    } catch (error) {
      console.error('Token limit middleware error:', error);
      return await handler();
    }
  };
}

// システム全体のメンテナンスモードチェック
export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
  emergencyAccess: boolean;
  message?: string;
}> {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_message', 'emergency_access', 'scheduled_maintenance']
        }
      }
    });

    const settingsMap: { [key: string]: string } = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    let isMaintenanceMode = settingsMap.maintenance_mode === 'true';
    
    // スケジュールされたメンテナンスもチェック
    if (!isMaintenanceMode && settingsMap.scheduled_maintenance) {
      try {
        const scheduleData = JSON.parse(settingsMap.scheduled_maintenance);
        const now = new Date();
        const start = new Date(scheduleData.start);
        const end = new Date(scheduleData.end);
        
        isMaintenanceMode = now >= start && now <= end;
      } catch (e) {
        console.error('Failed to parse scheduled maintenance:', e);
      }
    }

    return {
      isMaintenanceMode,
      emergencyAccess: settingsMap.emergency_access === 'true',
      message: settingsMap.maintenance_message || 'システムメンテナンス中です。しばらくお待ちください。'
    };
  } catch (error) {
    console.error('Failed to check maintenance mode:', error);
    return {
      isMaintenanceMode: false,
      emergencyAccess: false
    };
  }
}

// メンテナンスモードミドルウェア
export function createMaintenanceMiddleware() {
  return async function maintenanceMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      const maintenanceStatus = await checkMaintenanceMode();

      if (maintenanceStatus.isMaintenanceMode) {
        // 管理者APIは除外（緊急時対応のため）
        const isAdminApi = request.url.includes('/api/admin/settings') || 
                          request.url.includes('/api/admin/notifications') ||
                          request.url.includes('/api/admin/maintenance');
        
        // 緊急アクセスが有効な場合も管理者APIを許可
        const allowAccess = isAdminApi || maintenanceStatus.emergencyAccess;

        if (!allowAccess) {
          return new NextResponse(
            JSON.stringify({
              error: 'Service Unavailable',
              message: maintenanceStatus.message || 'The system is currently under maintenance. Please try again later.'
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '3600' // 1時間後に再試行
              }
            }
          );
        }
      }

      return await handler();

    } catch (error) {
      console.error('Maintenance middleware error:', error);
      return await handler();
    }
  };
}