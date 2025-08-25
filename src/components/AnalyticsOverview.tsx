'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Eye,
  Heart,
  FileText,
  Users,
  Zap,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';

interface OverviewData {
  overview: {
    totalPosts: number;
    totalEngagements: number;
    totalViews: number;
    averageEngagement: number;
    engagementRate: string;
  };
  topPosts: any[];
  dailyStats: any[];
  userActivity: any[];
  aiStats: {
    totalGenerations: number;
    totalTokensUsed: number;
    averageTokensPerGeneration: number;
  };
  period: string;
}

interface Props {
  data?: OverviewData;
  period: string;
}

export default function AnalyticsOverview({ data, period }: Props) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-500 text-center py-8">データがありません</p>
      </div>
    );
  }

  const statCards = [
    {
      title: '総投稿数',
      value: data.overview.totalPosts.toLocaleString(),
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      change: '+12%',
      changeType: 'positive' as const,
      description: `${data.period}の投稿数`
    },
    {
      title: '総ビュー数',
      value: data.overview.totalViews.toLocaleString(),
      icon: <Eye className="w-8 h-8 text-green-500" />,
      change: '+18%',
      changeType: 'positive' as const,
      description: 'すべての投稿の合計ビュー'
    },
    {
      title: '総エンゲージメント',
      value: data.overview.totalEngagements.toLocaleString(),
      icon: <Heart className="w-8 h-8 text-red-500" />,
      change: '+24%',
      changeType: 'positive' as const,
      description: 'いいね・コメント・シェア等'
    },
    {
      title: 'エンゲージメント率',
      value: `${data.overview.engagementRate}%`,
      icon: <Target className="w-8 h-8 text-purple-500" />,
      change: '+0.5%',
      changeType: 'positive' as const,
      description: 'ビューに対するエンゲージメント比率'
    },
    {
      title: 'AI生成数',
      value: data.aiStats.totalGenerations.toLocaleString(),
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      change: '+35%',
      changeType: 'positive' as const,
      description: 'AI生成コンテンツ数'
    },
    {
      title: '使用トークン',
      value: data.aiStats.totalTokensUsed.toLocaleString(),
      icon: <BarChart3 className="w-8 h-8 text-indigo-500" />,
      change: '+28%',
      changeType: 'positive' as const,
      description: 'AI生成で使用されたトークン'
    }
  ];

  const getChangeIcon = (changeType: string) => {
    return changeType === 'positive' ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getChangeColor = (changeType: string) => {
    return changeType === 'positive' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {card.icon}
                <div>
                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getChangeColor(card.changeType)}`}>
                {getChangeIcon(card.changeType)}
                {card.change}
              </div>
            </div>
            <p className="text-sm text-gray-600">{card.description}</p>
          </motion.div>
        ))}
      </div>

      {/* トップパフォーマンス投稿 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          トップパフォーマンス投稿
        </h3>
        
        {data.topPosts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">投稿データがありません</p>
        ) : (
          <div className="space-y-4">
            {data.topPosts.map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-600">
                      {post.user.name} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2 line-clamp-2">
                    {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.engagements.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {post.views > 0 ? ((post.engagements / post.views) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ユーザー活動 & 日別統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ユーザー活動 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            アクティブユーザー
          </h3>
          
          {data.userActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ユーザーデータがありません</p>
          ) : (
            <div className="space-y-3">
              {data.userActivity.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user._count.posts}投稿</p>
                    <p className="text-sm text-gray-600">#{index + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 日別統計サマリー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            最近の日別統計
          </h3>
          
          {!data.dailyStats || data.dailyStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">統計データがありません</p>
          ) : (
            <div className="space-y-3">
              {data.dailyStats.slice(-5).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{day.posts}投稿</span>
                      <span className="text-blue-600">{Number(day.views || 0).toLocaleString()}ビュー</span>
                      <span className="text-red-600">{Number(day.engagements || 0).toLocaleString()}エンゲージ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* AI統計詳細 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          AI生成統計
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {data.aiStats.totalGenerations}
            </div>
            <p className="text-yellow-800 font-medium">総生成数</p>
            <p className="text-yellow-700 text-sm mt-1">{data.period}</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {data.aiStats.totalTokensUsed.toLocaleString()}
            </div>
            <p className="text-blue-800 font-medium">使用トークン</p>
            <p className="text-blue-700 text-sm mt-1">合計消費量</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {data.aiStats.averageTokensPerGeneration}
            </div>
            <p className="text-green-800 font-medium">平均トークン/生成</p>
            <p className="text-green-700 text-sm mt-1">効率性指標</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}