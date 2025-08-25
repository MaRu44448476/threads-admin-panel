import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 分析データの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // デフォルト30日
    const type = searchParams.get('type') || 'overview';

    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(startDate);
      
      case 'posts':
        return await getPostAnalytics(startDate);
      
      case 'engagement':
        return await getEngagementAnalytics(startDate);
      
      case 'ai_performance':
        return await getAIPerformanceAnalytics(startDate);
      
      case 'trends':
        return await getTrendAnalytics(startDate);
      
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// 概要分析データ
async function getOverviewAnalytics(startDate: Date) {
  const [
    totalPosts,
    totalEngagements,
    totalViews,
    averageEngagement,
    topPerformingPosts,
    dailyStats,
    userActivity,
    aiGenerations
  ] = await Promise.all([
    // 総投稿数
    prisma.post.count({
      where: { publishedAt: { gte: startDate } }
    }),

    // 総エンゲージメント数
    prisma.post.aggregate({
      where: { publishedAt: { gte: startDate } },
      _sum: { engagements: true }
    }),

    // 総ビュー数
    prisma.post.aggregate({
      where: { publishedAt: { gte: startDate } },
      _sum: { views: true }
    }),

    // 平均エンゲージメント率
    prisma.post.aggregate({
      where: { 
        publishedAt: { gte: startDate },
        views: { gt: 0 }
      },
      _avg: { engagements: true }
    }),

    // トップパフォーマンス投稿
    prisma.post.findMany({
      where: { publishedAt: { gte: startDate } },
      orderBy: { engagements: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } }
      }
    }),

    // 日別統計
    prisma.$queryRaw`
      SELECT 
        DATE(publishedAt) as date,
        COUNT(*) as posts,
        SUM(views) as views,
        SUM(engagements) as engagements
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY DATE(publishedAt)
      ORDER BY DATE(publishedAt)
    `,

    // ユーザー別活動
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            posts: {
              where: { publishedAt: { gte: startDate } }
            }
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: 10
    }),

    // AI生成統計
    prisma.aIGeneration.aggregate({
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      _sum: { tokensUsed: true }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalPosts: Number(totalPosts) || 0,
        totalEngagements: Number(totalEngagements._sum.engagements) || 0,
        totalViews: Number(totalViews._sum.views) || 0,
        averageEngagement: Number(averageEngagement._avg.engagements) || 0,
        engagementRate: totalViews._sum.views ? 
          ((Number(totalEngagements._sum.engagements) || 0) / (Number(totalViews._sum.views) || 1) * 100).toFixed(2) : '0'
      },
      topPosts: topPerformingPosts,
      dailyStats,
      userActivity,
      aiStats: {
        totalGenerations: Number(aiGenerations._count.id) || 0,
        totalTokensUsed: Number(aiGenerations._sum.tokensUsed) || 0,
        averageTokensPerGeneration: aiGenerations._count.id ? 
          Math.round((Number(aiGenerations._sum.tokensUsed) || 0) / aiGenerations._count.id) : 0
      },
      period: `${Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))}日間`
    }
  });
}

// 投稿分析データ
async function getPostAnalytics(startDate: Date) {
  const [
    postsByStatus,
    postsByDay,
    topCategories,
    performanceDistribution
  ] = await Promise.all([
    // ステータス別投稿数
    prisma.post.groupBy({
      by: ['status'],
      where: { publishedAt: { gte: startDate } },
      _count: { id: true }
    }),

    // 曜日別投稿パフォーマンス
    prisma.$queryRaw`
      SELECT 
        strftime('%w', publishedAt) as dayOfWeek,
        COUNT(*) as posts,
        AVG(views) as avgViews,
        AVG(engagements) as avgEngagements
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY strftime('%w', publishedAt)
      ORDER BY dayOfWeek
    `,

    // カテゴリ別分析（コンテンツベース）
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN content LIKE '%#挨拶%' OR content LIKE '%おはよう%' THEN 'greeting'
          WHEN content LIKE '%#AI%' OR content LIKE '%AI生成%' THEN 'ai_generated'
          WHEN content LIKE '%#定期投稿%' THEN 'scheduled'
          ELSE 'other'
        END as category,
        COUNT(*) as count,
        AVG(views) as avgViews,
        AVG(engagements) as avgEngagements
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY category
      ORDER BY count DESC
    `,

    // パフォーマンス分布
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN engagements = 0 THEN 'no_engagement'
          WHEN engagements <= 5 THEN 'low'
          WHEN engagements <= 15 THEN 'medium'
          WHEN engagements <= 50 THEN 'high'
          ELSE 'viral'
        END as performance_tier,
        COUNT(*) as count
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY performance_tier
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      postsByStatus,
      postsByDay,
      topCategories,
      performanceDistribution
    }
  });
}

// エンゲージメント分析
async function getEngagementAnalytics(startDate: Date) {
  const [
    engagementTrends,
    viewsVsEngagements,
    topEngagementTimes
  ] = await Promise.all([
    // エンゲージメントトレンド
    prisma.$queryRaw`
      SELECT 
        DATE(publishedAt) as date,
        SUM(engagements) as totalEngagements,
        SUM(views) as totalViews,
        AVG(CAST(engagements AS REAL) / NULLIF(views, 0) * 100) as avgEngagementRate
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY DATE(publishedAt)
      ORDER BY DATE(publishedAt)
    `,

    // ビュー vs エンゲージメント相関
    prisma.post.findMany({
      where: { publishedAt: { gte: startDate } },
      select: {
        id: true,
        views: true,
        engagements: true,
        publishedAt: true,
        content: true
      },
      orderBy: { publishedAt: 'desc' }
    }),

    // 投稿時間別エンゲージメント
    prisma.$queryRaw`
      SELECT 
        strftime('%H', publishedAt) as hour,
        COUNT(*) as posts,
        AVG(engagements) as avgEngagements,
        AVG(views) as avgViews
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY strftime('%H', publishedAt)
      ORDER BY hour
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      engagementTrends,
      viewsVsEngagements,
      topEngagementTimes
    }
  });
}

// AI生成パフォーマンス分析
async function getAIPerformanceAnalytics(startDate: Date) {
  const [
    aiVsManualPosts,
    aiGenerationTrends,
    tokenEfficiency
  ] = await Promise.all([
    // AI生成 vs 手動投稿パフォーマンス比較
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM AIGeneration ag 
            WHERE ag.userId = p.userId 
            AND DATE(ag.createdAt) = DATE(p.publishedAt)
          ) THEN 'ai_generated'
          ELSE 'manual'
        END as type,
        COUNT(*) as count,
        AVG(views) as avgViews,
        AVG(engagements) as avgEngagements
      FROM Post p
      WHERE p.publishedAt >= ${startDate}
      GROUP BY type
    `,

    // AI生成トレンド
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as generations,
        SUM(tokensUsed) as totalTokens,
        AVG(tokensUsed) as avgTokens
      FROM AIGeneration
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
    `,

    // トークン効率性分析
    prisma.$queryRaw`
      SELECT 
        ag.model,
        COUNT(*) as generations,
        AVG(ag.tokensUsed) as avgTokens,
        AVG(p.engagements) as avgEngagements,
        AVG(CAST(p.engagements AS REAL) / NULLIF(ag.tokensUsed, 0) * 1000) as engagementPerKToken
      FROM AIGeneration ag
      JOIN Post p ON p.userId = ag.userId AND DATE(p.publishedAt) = DATE(ag.createdAt)
      WHERE ag.createdAt >= ${startDate}
      GROUP BY ag.model
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      aiVsManualPosts,
      aiGenerationTrends,
      tokenEfficiency
    }
  });
}

// トレンド分析
async function getTrendAnalytics(startDate: Date) {
  const [
    growthTrends,
    engagementTrends,
    userGrowth
  ] = await Promise.all([
    // 成長トレンド
    prisma.$queryRaw`
      SELECT 
        DATE(publishedAt) as date,
        COUNT(*) as posts,
        SUM(views) as views,
        SUM(engagements) as engagements,
        LAG(COUNT(*)) OVER (ORDER BY DATE(publishedAt)) as prevPosts,
        LAG(SUM(views)) OVER (ORDER BY DATE(publishedAt)) as prevViews
      FROM Post 
      WHERE publishedAt >= ${startDate}
      GROUP BY DATE(publishedAt)
      ORDER BY DATE(publishedAt)
    `,

    // エンゲージメント率トレンド
    prisma.$queryRaw`
      SELECT 
        DATE(publishedAt) as date,
        AVG(CAST(engagements AS REAL) / NULLIF(views, 0) * 100) as engagementRate
      FROM Post 
      WHERE publishedAt >= ${startDate} AND views > 0
      GROUP BY DATE(publishedAt)
      ORDER BY DATE(publishedAt)
    `,

    // ユーザー成長
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as newUsers
      FROM User 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt)
    `
  ]);

  return NextResponse.json({
    success: true,
    data: {
      growthTrends,
      engagementTrends,
      userGrowth
    }
  });
}