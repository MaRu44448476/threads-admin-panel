'use client';

import { motion } from 'framer-motion';
import { 
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  Heart,
  Target
} from 'lucide-react';

interface PostData {
  postsByStatus: any[];
  postsByDay: any[];
  topCategories: any[];
  performanceDistribution: any[];
}

interface Props {
  data?: PostData;
  period: string;
}

export default function PostPerformanceTable({ data, period }: Props) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-500 text-center py-8">データがありません</p>
      </div>
    );
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'published': return '公開済み';
      case 'draft': return '下書き';
      case 'scheduled': return '予約投稿';
      default: return status;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'greeting': return '挨拶投稿';
      case 'ai_generated': return 'AI生成';
      case 'scheduled': return '定期投稿';
      case 'other': return 'その他';
      default: return category;
    }
  };

  const getPerformanceName = (tier: string) => {
    switch (tier) {
      case 'no_engagement': return 'エンゲージメントなし';
      case 'low': return '低パフォーマンス';
      case 'medium': return '中パフォーマンス';
      case 'high': return '高パフォーマンス';
      case 'viral': return 'バイラル';
      default: return tier;
    }
  };

  const getPerformanceColor = (tier: string) => {
    switch (tier) {
      case 'no_engagement': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-green-100 text-green-800';
      case 'viral': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* ステータス別投稿数 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          ステータス別投稿数
        </h3>
        
        {!data.postsByStatus || data.postsByStatus.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ステータスデータがありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.postsByStatus.map((statusData: any, index: number) => (
              <motion.div
                key={statusData.status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {statusData._count.id}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statusData.status)}`}>
                    {getStatusName(statusData.status)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 曜日別パフォーマンス */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          曜日別パフォーマンス
        </h3>
        
        {!data.postsByDay || data.postsByDay.length === 0 ? (
          <p className="text-gray-500 text-center py-8">曜日別データがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">曜日</th>
                  <th className="p-3 text-center">投稿数</th>
                  <th className="p-3 text-center">平均ビュー</th>
                  <th className="p-3 text-center">平均エンゲージメント</th>
                  <th className="p-3 text-center">エンゲージメント率</th>
                </tr>
              </thead>
              <tbody>
                {data.postsByDay.map((dayData: any, index: number) => {
                  const dayOfWeek = parseInt(dayData.dayOfWeek);
                  const avgViews = Number(dayData.avgViews) || 0;
                  const avgEngagements = Number(dayData.avgEngagements) || 0;
                  const engagementRate = avgViews > 0 ? (avgEngagements / avgViews * 100) : 0;
                  
                  return (
                    <motion.tr 
                      key={dayOfWeek}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">{dayNames[dayOfWeek]}</td>
                      <td className="p-3 text-center">{dayData.posts}</td>
                      <td className="p-3 text-center">{avgViews.toFixed(1)}</td>
                      <td className="p-3 text-center">{avgEngagements.toFixed(1)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          engagementRate >= 3 ? 'bg-green-100 text-green-800' :
                          engagementRate >= 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {engagementRate.toFixed(1)}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* カテゴリ別分析 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          カテゴリ別分析
        </h3>
        
        {!data.topCategories || data.topCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">カテゴリデータがありません</p>
        ) : (
          <div className="space-y-4">
            {data.topCategories.map((category: any, index: number) => {
              const avgViews = Number(category.avgViews) || 0;
              const avgEngagements = Number(category.avgEngagements) || 0;
              const engagementRate = avgViews > 0 ? (avgEngagements / avgViews * 100) : 0;
              
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {getCategoryName(category.category)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.count}投稿
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Eye className="w-4 h-4" />
                          {avgViews.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <Heart className="w-4 h-4" />
                          {avgEngagements.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-medium">
                          <Target className="w-4 h-4" />
                          {engagementRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* パフォーマンスバー */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        engagementRate >= 5 ? 'bg-green-500' :
                        engagementRate >= 3 ? 'bg-yellow-500' :
                        engagementRate >= 1 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(engagementRate * 20, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* パフォーマンス分布 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          パフォーマンス分布
        </h3>
        
        {!data.performanceDistribution || data.performanceDistribution.length === 0 ? (
          <p className="text-gray-500 text-center py-8">分布データがありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.performanceDistribution.map((tier: any, index: number) => (
              <motion.div
                key={tier.performance_tier}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 transition-colors"
              >
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.count}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(tier.performance_tier)}`}>
                  {getPerformanceName(tier.performance_tier)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}