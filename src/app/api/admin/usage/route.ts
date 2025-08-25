import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimiter } from '@/lib/api-rate-limiter';
import { prisma } from '@/lib/prisma';

// GET: API使用量統計を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary'; // summary, stats, history
    const period = searchParams.get('period') || 'day';
    const userId = searchParams.get('userId');

    switch (type) {
      case 'summary':
        const summary = await apiRateLimiter.getUsageSummary(userId || undefined);
        
        return NextResponse.json({
          success: true,
          data: summary
        });

      case 'stats':
        const stats = await apiRateLimiter.getUsageStatistics(
          period as 'hour' | 'day' | 'week' | 'month'
        );
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            period
          }
        });

      case 'history':
        const historyData = await getUsageHistory(period, userId);
        
        return NextResponse.json({
          success: true,
          data: historyData
        });

      case 'limits':
        const limits = await getCurrentLimits();
        
        return NextResponse.json({
          success: true,
          data: limits
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

// POST: API使用量をテストまたはリセット
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'test_rate_limit':
        // レート制限をテスト
        const { identifier, endpoint, method } = data;
        
        if (!identifier || !endpoint) {
          return NextResponse.json(
            { error: 'Identifier and endpoint are required' },
            { status: 400 }
          );
        }

        const result = await apiRateLimiter.checkRateLimit(
          identifier,
          endpoint,
          method || 'GET'
        );

        return NextResponse.json({
          success: true,
          data: result
        });

      case 'clear_cache':
        // キャッシュをクリア
        apiRateLimiter.clearCache();
        
        await prisma.adminLog.create({
          data: {
            action: 'api_cache_cleared',
            details: 'API rate limiter cache was manually cleared'
          }
        });

        return NextResponse.json({
          success: true,
          message: 'API cache cleared'
        });

      case 'generate_test_usage':
        // テスト用使用量データを生成
        await generateTestUsageData();
        
        return NextResponse.json({
          success: true,
          message: 'Test usage data generated'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Usage action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

// 使用履歴を取得
async function getUsageHistory(period: string, userId?: string | null) {
  let startDate = new Date();
  let groupBy = 'hour';
  
  switch (period) {
    case 'hour':
      startDate.setHours(startDate.getHours() - 1);
      groupBy = 'minute';
      break;
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      groupBy = 'hour';
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      groupBy = 'day';
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = 'day';
      break;
  }

  // API使用量履歴
  const apiUsageHistory = await prisma.$queryRaw`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', createdAt) as time_bucket,
      COUNT(*) as api_calls
    FROM AdminLog 
    WHERE action = 'api_usage' 
      AND createdAt >= ${startDate}
    GROUP BY strftime('%Y-%m-%d %H:00:00', createdAt)
    ORDER BY time_bucket
  `;

  // トークン使用量履歴
  const tokenUsageHistory = await prisma.$queryRaw`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', createdAt) as time_bucket,
      SUM(tokensUsed) as tokens_used,
      COUNT(*) as generations
    FROM AIGeneration 
    WHERE createdAt >= ${startDate}
      ${userId ? `AND userId = ${userId}` : ''}
    GROUP BY strftime('%Y-%m-%d %H:00:00', createdAt)
    ORDER BY time_bucket
  `;

  // エラー率計算
  const errorHistory = await prisma.$queryRaw`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', createdAt) as time_bucket,
      COUNT(*) as total_actions,
      SUM(CASE WHEN action LIKE '%_error' OR action LIKE '%_failed' THEN 1 ELSE 0 END) as errors
    FROM AdminLog 
    WHERE createdAt >= ${startDate}
    GROUP BY strftime('%Y-%m-%d %H:00:00', createdAt)
    ORDER BY time_bucket
  `;

  return {
    apiUsage: apiUsageHistory,
    tokenUsage: tokenUsageHistory,
    errorRate: errorHistory,
    period,
    startDate
  };
}

// 現在の制限値を取得
async function getCurrentLimits() {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: {
        in: ['api_rate_limit', 'max_tokens_per_day', 'max_concurrent_schedules']
      }
    }
  });

  const limits: { [key: string]: any } = {};
  
  settings.forEach(setting => {
    limits[setting.key] = {
      value: setting.type === 'number' ? parseInt(setting.value) : setting.value,
      type: setting.type,
      description: setting.description
    };
  });

  return limits;
}

// テスト用使用量データを生成
async function generateTestUsageData() {
  const testEndpoints = [
    '/api/admin/posts',
    '/api/admin/users', 
    '/api/admin/schedules',
    '/api/admin/analytics',
    '/api/admin/notifications'
  ];

  const testMethods = ['GET', 'POST', 'PATCH', 'DELETE'];
  const testIdentifiers = ['admin', 'user1', 'user2', 'system'];

  // 過去24時間のランダムなAPI使用量を生成
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const promises = [];
  
  for (let i = 0; i < 50; i++) {
    const randomTime = new Date(
      dayAgo.getTime() + Math.random() * (now.getTime() - dayAgo.getTime())
    );
    
    const endpoint = testEndpoints[Math.floor(Math.random() * testEndpoints.length)];
    const method = testMethods[Math.floor(Math.random() * testMethods.length)];
    const identifier = testIdentifiers[Math.floor(Math.random() * testIdentifiers.length)];

    promises.push(
      prisma.adminLog.create({
        data: {
          action: 'api_usage',
          details: JSON.stringify({
            identifier,
            endpoint,
            method,
            timestamp: randomTime.toISOString()
          }),
          createdAt: randomTime
        }
      })
    );
  }

  await Promise.all(promises);
  
  // テスト用通知も作成
  await prisma.notification.create({
    data: {
      title: 'テストデータ生成完了',
      message: `50件のテスト用API使用量データを生成しました`,
      type: 'info',
      category: 'system'
    }
  });
}