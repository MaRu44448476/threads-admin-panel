import { prisma } from './prisma';

export interface AIEffectivenessMetrics {
  generationId: string;
  contentQuality: number; // 1-10 scale
  engagementPrediction: number;
  actualEngagement: number;
  contentLength: number;
  topicRelevance: number;
  sentimentScore: number;
  uniquenessScore: number;
  hashtagEffectiveness: number;
}

export interface AIPerformanceReport {
  totalGenerations: number;
  averageEngagementRate: number;
  topPerformingTopics: string[];
  contentOptimizationSuggestions: string[];
  modelComparison: {
    model: string;
    avgEngagement: number;
    avgTokenUsage: number;
    efficiency: number;
  }[];
  trendingHashtags: string[];
  optimalPostingTimes: number[];
}

export class AIEffectivenessAnalyzer {
  private static instance: AIEffectivenessAnalyzer;

  static getInstance(): AIEffectivenessAnalyzer {
    if (!AIEffectivenessAnalyzer.instance) {
      AIEffectivenessAnalyzer.instance = new AIEffectivenessAnalyzer();
    }
    return AIEffectivenessAnalyzer.instance;
  }

  // AI生成コンテンツの効果を分析
  async analyzeAIEffectiveness(days: number = 30): Promise<AIPerformanceReport> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // AI生成データと関連する投稿データを取得
      const aiGenerations = await prisma.aIGeneration.findMany({
        where: { createdAt: { gte: startDate } },
        include: {
          user: {
            include: {
              posts: {
                where: { publishedAt: { gte: startDate } },
                select: {
                  id: true,
                  content: true,
                  views: true,
                  engagements: true,
                  publishedAt: true
                }
              }
            }
          }
        }
      });

      // モデル別パフォーマンス分析
      const modelComparison = await this.analyzeModelPerformance(startDate);
      
      // トピック分析
      const topPerformingTopics = await this.identifyTopPerformingTopics(aiGenerations);
      
      // ハッシュタグ効果分析
      const trendingHashtags = await this.analyzeTrendingHashtags(days);
      
      // 最適投稿時間の分析
      const optimalPostingTimes = await this.findOptimalPostingTimes(days);
      
      // エンゲージメント率計算
      const totalEngagements = aiGenerations.reduce((sum, gen) => {
        return sum + gen.user.posts.reduce((postSum, post) => postSum + post.engagements, 0);
      }, 0);
      
      const totalViews = aiGenerations.reduce((sum, gen) => {
        return sum + gen.user.posts.reduce((postSum, post) => postSum + post.views, 0);
      }, 0);
      
      const averageEngagementRate = totalViews > 0 ? (totalEngagements / totalViews * 100) : 0;
      
      // 最適化提案を生成
      const contentOptimizationSuggestions = await this.generateOptimizationSuggestions(
        aiGenerations,
        modelComparison,
        topPerformingTopics
      );

      return {
        totalGenerations: aiGenerations.length,
        averageEngagementRate: Number(averageEngagementRate.toFixed(2)),
        topPerformingTopics,
        contentOptimizationSuggestions,
        modelComparison,
        trendingHashtags,
        optimalPostingTimes
      };

    } catch (error) {
      console.error('Failed to analyze AI effectiveness:', error);
      throw error;
    }
  }

  // モデル別パフォーマンス分析
  private async analyzeModelPerformance(startDate: Date) {
    try {
      const modelStats = await prisma.$queryRaw<any[]>`
        SELECT 
          ag.model,
          COUNT(*) as generations,
          AVG(ag.tokensUsed) as avgTokenUsage,
          AVG(p.engagements) as avgEngagement,
          AVG(p.views) as avgViews,
          AVG(CAST(p.engagements AS REAL) / NULLIF(p.views, 0) * 100) as engagementRate
        FROM AIGeneration ag
        LEFT JOIN Post p ON p.userId = ag.userId 
          AND DATE(p.publishedAt) = DATE(ag.createdAt)
        WHERE ag.createdAt >= ${startDate}
        GROUP BY ag.model
      `;

      return modelStats.map(stat => ({
        model: stat.model || 'unknown',
        avgEngagement: Number(stat.avgEngagement) || 0,
        avgTokenUsage: Number(stat.avgTokenUsage) || 0,
        efficiency: Number(stat.avgTokenUsage) > 0 ? 
          Number(stat.avgEngagement) / Number(stat.avgTokenUsage) * 1000 : 0
      }));

    } catch (error) {
      console.error('Failed to analyze model performance:', error);
      return [];
    }
  }

  // トップパフォーマンストピック識別
  private async identifyTopPerformingTopics(aiGenerations: any[]): Promise<string[]> {
    try {
      // プロンプトからトピックを抽出
      const topicPerformance: { [key: string]: { count: number; engagement: number } } = {};

      for (const generation of aiGenerations) {
        const topic = this.extractTopicFromPrompt(generation.prompt);
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { count: 0, engagement: 0 };
        }
        
        topicPerformance[topic].count++;
        
        // 関連する投稿のエンゲージメントを加算
        const relatedPosts = generation.user.posts.filter((post: any) => 
          new Date(post.publishedAt).toDateString() === new Date(generation.createdAt).toDateString()
        );
        
        const totalEngagement = relatedPosts.reduce((sum: number, post: any) => sum + post.engagements, 0);
        topicPerformance[topic].engagement += totalEngagement;
      }

      // エンゲージメント平均で並び替え
      return Object.entries(topicPerformance)
        .sort(([, a], [, b]) => (b.engagement / b.count) - (a.engagement / a.count))
        .slice(0, 5)
        .map(([topic]) => topic);

    } catch (error) {
      console.error('Failed to identify top performing topics:', error);
      return [];
    }
  }

  // プロンプトからトピックを抽出
  private extractTopicFromPrompt(prompt: string): string {
    // 簡単なキーワードマッチング
    const topicKeywords = {
      'テクノロジー': ['テクノロジー', '技術', 'AI', 'IT'],
      '天気': ['天気', '気候', '気分'],
      '本・アプリ': ['本', 'アプリ', 'おすすめ'],
      '健康': ['健康', 'ウェルネス', '運動'],
      '創造性': ['創造性', 'インスピレーション', 'クリエイティブ']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        return topic;
      }
    }

    return 'その他';
  }

  // トレンドハッシュタグ分析
  private async analyzeTrendingHashtags(days: number): Promise<string[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const posts = await prisma.post.findMany({
        where: { publishedAt: { gte: startDate } },
        select: { content: true, engagements: true }
      });

      const hashtagPerformance: { [key: string]: { count: number; totalEngagement: number } } = {};

      posts.forEach(post => {
        const hashtags = this.extractHashtags(post.content);
        hashtags.forEach(hashtag => {
          if (!hashtagPerformance[hashtag]) {
            hashtagPerformance[hashtag] = { count: 0, totalEngagement: 0 };
          }
          hashtagPerformance[hashtag].count++;
          hashtagPerformance[hashtag].totalEngagement += post.engagements;
        });
      });

      return Object.entries(hashtagPerformance)
        .filter(([, data]) => data.count >= 3) // 最低3回使用
        .sort(([, a], [, b]) => (b.totalEngagement / b.count) - (a.totalEngagement / a.count))
        .slice(0, 10)
        .map(([hashtag]) => hashtag);

    } catch (error) {
      console.error('Failed to analyze trending hashtags:', error);
      return [];
    }
  }

  // ハッシュタグを抽出
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g;
    return content.match(hashtagRegex) || [];
  }

  // 最適投稿時間を特定
  private async findOptimalPostingTimes(days: number): Promise<number[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const hourlyPerformance = await prisma.$queryRaw<any[]>`
        SELECT 
          strftime('%H', publishedAt) as hour,
          AVG(CAST(engagements AS REAL) / NULLIF(views, 0) * 100) as avgEngagementRate,
          COUNT(*) as posts
        FROM Post 
        WHERE publishedAt >= ${startDate} AND views > 0
        GROUP BY strftime('%H', publishedAt)
        HAVING posts >= 5
        ORDER BY avgEngagementRate DESC
      `;

      return hourlyPerformance
        .slice(0, 5)
        .map(item => Number(item.hour));

    } catch (error) {
      console.error('Failed to find optimal posting times:', error);
      return [];
    }
  }

  // 最適化提案を生成
  private async generateOptimizationSuggestions(
    aiGenerations: any[],
    modelComparison: any[],
    topTopics: string[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // モデル効率性に基づく提案
    const bestModel = modelComparison.sort((a, b) => b.efficiency - a.efficiency)[0];
    if (bestModel) {
      suggestions.push(`最も効率的なAIモデルは ${bestModel.model} です。このモデルの使用を優先してください。`);
    }

    // トピックに基づく提案
    if (topTopics.length > 0) {
      suggestions.push(`最もエンゲージメントが高いトピック: ${topTopics[0]}。このようなテーマでより多くのコンテンツを生成することを検討してください。`);
    }

    // 一般的な最適化提案
    suggestions.push('ハッシュタグの使用により投稿の発見性を高めてください。');
    suggestions.push('最適な投稿時間帯を活用して、より多くのオーディエンスにリーチしてください。');
    suggestions.push('定期的に投稿パフォーマンスを分析し、コンテンツ戦略を調整してください。');

    return suggestions;
  }

  // コンテンツ品質スコアを計算
  async calculateContentQualityScore(content: string): Promise<number> {
    try {
      let score = 5; // ベースライン

      // 長さによる評価
      const length = content.length;
      if (length >= 100 && length <= 200) score += 1;
      else if (length < 50) score -= 1;

      // ハッシュタグの有無
      const hashtags = this.extractHashtags(content);
      if (hashtags.length >= 2 && hashtags.length <= 5) score += 1;
      else if (hashtags.length === 0) score -= 0.5;

      // 絵文字の有無
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
      const emojiCount = (content.match(emojiRegex) || []).length;
      if (emojiCount >= 1 && emojiCount <= 3) score += 0.5;

      // 文章の読みやすさ（簡易評価）
      const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) score += 0.5;

      return Math.min(Math.max(score, 1), 10); // 1-10の範囲に収める

    } catch (error) {
      console.error('Failed to calculate content quality score:', error);
      return 5; // デフォルト値
    }
  }

  // リアルタイム効果予測
  async predictEngagement(content: string, userId: string): Promise<number> {
    try {
      // ユーザーの過去のパフォーマンスを取得
      const userPosts = await prisma.post.findMany({
        where: { userId },
        orderBy: { publishedAt: 'desc' },
        take: 10
      });

      if (userPosts.length === 0) return 5; // デフォルト予測

      const avgEngagement = userPosts.reduce((sum, post) => sum + post.engagements, 0) / userPosts.length;
      
      // コンテンツ特徴による調整
      const qualityScore = await this.calculateContentQualityScore(content);
      const adjustment = (qualityScore - 5) * 0.2; // 品質スコアに基づく調整

      return Math.max(avgEngagement * (1 + adjustment), 0);

    } catch (error) {
      console.error('Failed to predict engagement:', error);
      return 5;
    }
  }
}

// エクスポート
export const aiEffectivenessAnalyzer = AIEffectivenessAnalyzer.getInstance();