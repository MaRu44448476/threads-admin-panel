'use client';

import { motion } from 'framer-motion';
import { 
  Users,
  TrendingUp,
  Award,
  Eye,
  Heart,
  Target
} from 'lucide-react';

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    totalPosts: number;
    totalViews: number;
    totalEngagements: number;
    avgViews: number;
    avgEngagements: number;
    engagementRate: number;
  };
}

interface Props {
  data?: UserData[];
  period: string;
}

export default function UserAnalytics({ data, period }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          ユーザー分析
        </h3>
        <p className="text-gray-500 text-center py-8">ユーザーデータがありません</p>
      </div>
    );
  }

  // トップパフォーマーを識別
  const sortedByEngagement = [...data].sort((a, b) => b.stats.engagementRate - a.stats.engagementRate);
  const sortedByPosts = [...data].sort((a, b) => b.stats.totalPosts - a.stats.totalPosts);
  const sortedByViews = [...data].sort((a, b) => b.stats.totalViews - a.stats.totalViews);

  const getRankBadge = (index: number) => {
    if (index === 0) return { color: 'bg-yellow-500', text: '#1' };
    if (index === 1) return { color: 'bg-gray-400', text: '#2' };
    if (index === 2) return { color: 'bg-orange-600', text: '#3' };
    return { color: 'bg-blue-500', text: `#${index + 1}` };
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600 bg-green-50';
    if (rate >= 3) return 'text-yellow-600 bg-yellow-50';
    if (rate >= 1) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* トップパフォーマー概要 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          トップパフォーマー
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 最高エンゲージメント率 */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-green-900">最高エンゲージメント率</h4>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {sortedByEngagement[0]?.stats.engagementRate.toFixed(1)}%
            </p>
            <p className="text-green-700 text-sm">
              {sortedByEngagement[0]?.user.name}
            </p>
          </div>
          
          {/* 最多投稿 */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-blue-900">最多投稿</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {sortedByPosts[0]?.stats.totalPosts}投稿
            </p>
            <p className="text-blue-700 text-sm">
              {sortedByPosts[0]?.user.name}
            </p>
          </div>
          
          {/* 最多ビュー */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-purple-900">最多ビュー</h4>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {sortedByViews[0]?.stats.totalViews.toLocaleString()}
            </p>
            <p className="text-purple-700 text-sm">
              {sortedByViews[0]?.user.name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 詳細ユーザー分析 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          詳細ユーザー分析 ({period}日間)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">ランク</th>
                <th className="p-3 text-left">ユーザー</th>
                <th className="p-3 text-center">投稿数</th>
                <th className="p-3 text-center">総ビュー</th>
                <th className="p-3 text-center">総エンゲージメント</th>
                <th className="p-3 text-center">平均ビュー/投稿</th>
                <th className="p-3 text-center">平均エンゲージメント/投稿</th>
                <th className="p-3 text-center">エンゲージメント率</th>
              </tr>
            </thead>
            <tbody>
              {sortedByEngagement.map((userData, index) => {
                const rank = getRankBadge(index);
                
                return (
                  <motion.tr 
                    key={userData.user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className={`w-8 h-8 ${rank.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                        {rank.text}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-900">{userData.user.name}</p>
                        <p className="text-xs text-gray-500">{userData.user.email}</p>
                      </div>
                    </td>
                    
                    <td className="p-3 text-center font-medium">
                      {userData.stats.totalPosts}
                    </td>
                    
                    <td className="p-3 text-center">
                      {userData.stats.totalViews.toLocaleString()}
                    </td>
                    
                    <td className="p-3 text-center">
                      {userData.stats.totalEngagements.toLocaleString()}
                    </td>
                    
                    <td className="p-3 text-center">
                      {userData.stats.avgViews.toFixed(1)}
                    </td>
                    
                    <td className="p-3 text-center">
                      {userData.stats.avgEngagements.toFixed(1)}
                    </td>
                    
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(userData.stats.engagementRate)}`}>
                        {userData.stats.engagementRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ユーザーパフォーマンス比較 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          ユーザーパフォーマンス比較
        </h3>
        
        <div className="space-y-4">
          {sortedByEngagement.slice(0, 10).map((userData, index) => {
            const maxEngagement = Math.max(...data.map(u => u.stats.engagementRate), 1);
            const maxPosts = Math.max(...data.map(u => u.stats.totalPosts), 1);
            
            const engagementWidth = (userData.stats.engagementRate / maxEngagement) * 100;
            const postsWidth = (userData.stats.totalPosts / maxPosts) * 100;
            
            return (
              <motion.div
                key={userData.user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{userData.user.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{userData.stats.totalPosts}投稿</span>
                      <span>{userData.stats.totalViews.toLocaleString()}ビュー</span>
                      <span>{userData.stats.totalEngagements.toLocaleString()}エンゲージメント</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {userData.stats.engagementRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">エンゲージメント率</p>
                  </div>
                </div>
                
                {/* エンゲージメント率バー */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>エンゲージメント率</span>
                    <span>{userData.stats.engagementRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${engagementWidth}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 投稿数バー */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>投稿数</span>
                    <span>{userData.stats.totalPosts}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${postsWidth}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}