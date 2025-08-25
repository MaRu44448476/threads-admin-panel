import { prisma } from './prisma';

export interface EngagementMetrics {
  postId: string;
  views: number;
  engagements: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  timestamp: Date;
}

export interface EngagementTrend {
  hour: number;
  views: number;
  engagements: number;
  engagementRate: number;
}

export class EngagementTracker {
  private static instance: EngagementTracker;

  static getInstance(): EngagementTracker {
    if (!EngagementTracker.instance) {
      EngagementTracker.instance = new EngagementTracker();
    }
    return EngagementTracker.instance;
  }

  // 投稿のエンゲージメントを更新
  async updatePostEngagement(postId: string, metrics: Partial<EngagementMetrics>) {
    try {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          views: metrics.views,
          engagements: metrics.engagements,
          updatedAt: new Date()
        }
      });

      // エンゲージメント履歴を記録
      await this.recordEngagementHistory(postId, metrics);

      console.log(`📊 Updated engagement for post ${postId}: views=${metrics.views}, engagements=${metrics.engagements}`);
      return updatedPost;

    } catch (error) {
      console.error('Failed to update post engagement:', error);
      throw error;
    }
  }

  // エンゲージメント履歴を記録
  private async recordEngagementHistory(postId: string, metrics: Partial<EngagementMetrics>) {
    try {
      // 履歴テーブルがない場合はスキップ（必要に応じて後で実装）
      // await prisma.engagementHistory.create({
      //   data: {
      //     postId,
      //     views: metrics.views || 0,
      //     engagements: metrics.engagements || 0,
      //     timestamp: new Date()
      //   }
      // });

      // 代わりに管理ログに記録
      await prisma.adminLog.create({
        data: {
          action: 'engagement_updated',
          details: `Post ${postId} engagement updated: views=${metrics.views}, engagements=${metrics.engagements}`
        }
      });

    } catch (error) {
      console.error('Failed to record engagement history:', error);
    }
  }

  // 投稿のパフォーマンスを分析
  async analyzePostPerformance(postId: string) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: { select: { name: true, email: true } }
        }
      });

      if (!post) {
        throw new Error('Post not found');
      }

      const engagementRate = post.views > 0 ? (post.engagements / post.views * 100) : 0;
      
      // 同期間の他の投稿との比較
      const avgMetrics = await this.getAverageMetrics(post.publishedAt || post.createdAt);
      
      const performance = {
        post,
        metrics: {
          views: post.views,
          engagements: post.engagements,
          engagementRate: Number(engagementRate.toFixed(2))
        },
        comparison: {
          viewsVsAvg: avgMetrics.avgViews > 0 ? ((post.views - avgMetrics.avgViews) / avgMetrics.avgViews * 100) : 0,
          engagementsVsAvg: avgMetrics.avgEngagements > 0 ? ((post.engagements - avgMetrics.avgEngagements) / avgMetrics.avgEngagements * 100) : 0
        },
        category: this.categorizePerformance(engagementRate, post.engagements)
      };

      return performance;

    } catch (error) {
      console.error('Failed to analyze post performance:', error);
      throw error;
    }
  }

  // 平均メトリクスを取得
  private async getAverageMetrics(publishedAt: Date) {
    const startDate = new Date(publishedAt);
    startDate.setDate(startDate.getDate() - 7); // 7日前から
    const endDate = new Date(publishedAt);
    endDate.setDate(endDate.getDate() + 7); // 7日後まで

    const avgMetrics = await prisma.post.aggregate({
      where: {
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        views: true,
        engagements: true
      }
    });

    return {
      avgViews: avgMetrics._avg.views || 0,
      avgEngagements: avgMetrics._avg.engagements || 0
    };
  }

  // パフォーマンスをカテゴリ分け
  private categorizePerformance(engagementRate: number, engagements: number): string {
    if (engagements === 0) return 'no_engagement';
    if (engagementRate >= 10) return 'viral';
    if (engagementRate >= 5) return 'high';
    if (engagementRate >= 2) return 'medium';
    return 'low';
  }

  // エンゲージメントトレンドを取得
  async getEngagementTrends(days: number = 30): Promise<EngagementTrend[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const hourlyTrends = await prisma.$queryRaw<EngagementTrend[]>`
        SELECT 
          strftime('%H', publishedAt) as hour,
          AVG(views) as views,
          AVG(engagements) as engagements,
          AVG(CAST(engagements AS REAL) / NULLIF(views, 0) * 100) as engagementRate
        FROM Post 
        WHERE publishedAt >= ${startDate}
        GROUP BY strftime('%H', publishedAt)
        ORDER BY hour
      `;

      return hourlyTrends.map(trend => ({
        ...trend,
        hour: Number(trend.hour),
        views: Number(trend.views || 0),
        engagements: Number(trend.engagements || 0),
        engagementRate: Number((trend.engagementRate || 0).toFixed(2))
      }));

    } catch (error) {
      console.error('Failed to get engagement trends:', error);
      return [];
    }
  }

  // トップパフォーマー投稿を取得
  async getTopPerformingPosts(limit: number = 10, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const topPosts = await prisma.post.findMany({
        where: {
          publishedAt: { gte: startDate }
        },
        orderBy: [
          { engagements: 'desc' },
          { views: 'desc' }
        ],
        take: limit,
        include: {
          user: { select: { name: true, email: true } }
        }
      });

      return topPosts.map(post => ({
        ...post,
        engagementRate: post.views > 0 ? Number((post.engagements / post.views * 100).toFixed(2)) : 0,
        performance: this.categorizePerformance(
          post.views > 0 ? (post.engagements / post.views * 100) : 0,
          post.engagements
        )
      }));

    } catch (error) {
      console.error('Failed to get top performing posts:', error);
      return [];
    }
  }

  // エンゲージメント率が低い投稿を特定
  async getLowPerformingPosts(limit: number = 10, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const lowPerformingPosts = await prisma.post.findMany({
        where: {
          publishedAt: { gte: startDate },
          views: { gt: 0 } // ビューがある投稿のみ
        },
        orderBy: [
          { engagements: 'asc' },
        ],
        take: limit,
        include: {
          user: { select: { name: true, email: true } }
        }
      });

      return lowPerformingPosts
        .map(post => ({
          ...post,
          engagementRate: Number((post.engagements / post.views * 100).toFixed(2))
        }))
        .filter(post => post.engagementRate < 2); // 2%未満のエンゲージメント率

    } catch (error) {
      console.error('Failed to get low performing posts:', error);
      return [];
    }
  }

  // ユーザー別エンゲージメント分析
  async getUserEngagementAnalysis(userId?: string) {
    try {
      const whereClause = userId ? { userId } : {};

      const userStats = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          posts: {
            select: {
              views: true,
              engagements: true,
              publishedAt: true
            }
          }
        }
      });

      return userStats.map(user => {
        const totalViews = user.posts.reduce((sum, post) => sum + post.views, 0);
        const totalEngagements = user.posts.reduce((sum, post) => sum + post.engagements, 0);
        const avgViews = user.posts.length > 0 ? totalViews / user.posts.length : 0;
        const avgEngagements = user.posts.length > 0 ? totalEngagements / user.posts.length : 0;
        const engagementRate = totalViews > 0 ? (totalEngagements / totalViews * 100) : 0;

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          stats: {
            totalPosts: user.posts.length,
            totalViews,
            totalEngagements,
            avgViews: Number(avgViews.toFixed(1)),
            avgEngagements: Number(avgEngagements.toFixed(1)),
            engagementRate: Number(engagementRate.toFixed(2))
          }
        };
      });

    } catch (error) {
      console.error('Failed to get user engagement analysis:', error);
      return [];
    }
  }

  // デモ用のランダムエンゲージメントを生成
  async generateRandomEngagement(postId: string) {
    try {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) return null;

      // 現在の値に基づいてランダムな増加を生成
      const viewsIncrease = Math.floor(Math.random() * 20) + 1;
      const engagementsIncrease = Math.floor(Math.random() * 5);

      const newViews = post.views + viewsIncrease;
      const newEngagements = post.engagements + engagementsIncrease;

      return await this.updatePostEngagement(postId, {
        views: newViews,
        engagements: newEngagements
      });

    } catch (error) {
      console.error('Failed to generate random engagement:', error);
      return null;
    }
  }
}

// エクスポート
export const engagementTracker = EngagementTracker.getInstance();