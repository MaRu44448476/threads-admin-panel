'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Eye,
  Heart,
  Clock,
  BarChart3,
  Target
} from 'lucide-react';

interface EngagementData {
  engagementTrends: any[];
  viewsVsEngagements: any[];
  topEngagementTimes: any[];
}

interface Props {
  data?: EngagementData;
  period: string;
}

export default function EngagementChart({ data, period }: Props) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-500 text-center py-8">データがありません</p>
      </div>
    );
  }

  // 時間別エンゲージメントの最高値を取得
  const maxEngagement = Math.max(...(data.topEngagementTimes?.map((time: any) => Number(time.avgEngagements) || 0) || [1]));
  const maxViews = Math.max(...(data.topEngagementTimes?.map((time: any) => Number(time.avgViews) || 0) || [1]));

  // 曜日の名前
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-6">
      {/* エンゲージメントトレンド */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          エンゲージメントトレンド
        </h3>
        
        {!data.engagementTrends || data.engagementTrends.length === 0 ? (
          <p className="text-gray-500 text-center py-8">トレンドデータがありません</p>
        ) : (
          <div className="space-y-4">
            {data.engagementTrends.slice(-10).map((trend: any, index: number) => {
              const engagementRate = Number(trend.avgEngagementRate) || 0;
              const totalViews = Number(trend.totalViews) || 0;
              const totalEngagements = Number(trend.totalEngagements) || 0;
              
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-gray-900">
                      {new Date(trend.date).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Eye className="w-4 h-4" />
                        {totalViews.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <Heart className="w-4 h-4" />
                        {totalEngagements.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <Target className="w-4 h-4" />
                        {engagementRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* エンゲージメント率のビジュアルバー */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(engagementRate * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 時間別エンゲージメント */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          時間別エンゲージメント分析
        </h3>
        
        {!data.topEngagementTimes || data.topEngagementTimes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">時間別データがありません</p>
        ) : (
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const timeData = data.topEngagementTimes.find((t: any) => Number(t.hour) === hour);
              const avgEngagements = Number(timeData?.avgEngagements) || 0;
              const avgViews = Number(timeData?.avgViews) || 0;
              const posts = Number(timeData?.posts) || 0;
              
              const engagementHeight = maxEngagement > 0 ? (avgEngagements / maxEngagement * 100) : 0;
              const viewHeight = maxViews > 0 ? (avgViews / maxViews * 100) : 0;
              
              return (
                <div key={hour} className="text-center">
                  <div className="h-24 flex flex-col justify-end mb-2">
                    {/* エンゲージメントバー */}
                    <div 
                      className="bg-gradient-to-t from-red-400 to-red-500 rounded-t-sm mb-1"
                      style={{ height: `${engagementHeight}%`, minHeight: posts > 0 ? '4px' : '0px' }}
                      title={`${hour}時: ${avgEngagements.toFixed(1)}エンゲージメント`}
                    ></div>
                    {/* ビューバー */}
                    <div 
                      className="bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-sm"
                      style={{ height: `${Math.max(viewHeight * 0.3, 0)}%`, minHeight: posts > 0 ? '2px' : '0px' }}
                      title={`${hour}時: ${avgViews.toFixed(1)}ビュー`}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-600 font-medium">
                    {hour.toString().padStart(2, '0')}
                  </div>
                  
                  {posts > 0 && (
                    <div className="text-xs text-gray-500">
                      {posts}投稿
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">エンゲージメント</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">ビュー（相対）</span>
          </div>
        </div>
      </motion.div>

      {/* ビュー vs エンゲージメント相関 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          ビュー vs エンゲージメント相関
        </h3>
        
        {!data.viewsVsEngagements || data.viewsVsEngagements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">相関データがありません</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.viewsVsEngagements
              .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
              .slice(0, 20)
              .map((post: any, index: number) => {
                const engagementRate = post.views > 0 ? (post.engagements / post.views * 100) : 0;
                const maxWidth = Math.max(post.views, 1);
                
                return (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {post.content.length > 80 ? `${post.content.substring(0, 80)}...` : post.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <Heart className="w-3 h-3" />
                            {post.engagements}
                          </div>
                          <div className="flex items-center gap-1 text-purple-600 font-medium">
                            <Target className="w-3 h-3" />
                            {engagementRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* エンゲージメント率のビジュアルインジケーター */}
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          engagementRate >= 5 ? 'bg-green-500' :
                          engagementRate >= 2 ? 'bg-yellow-500' :
                          engagementRate >= 1 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(engagementRate * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </motion.div>
    </div>
  );
}