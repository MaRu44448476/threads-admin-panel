'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Users,
  Calendar,
  Zap,
  Target,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import AnalyticsOverview from './AnalyticsOverview';
import EngagementChart from './EngagementChart';
import PostPerformanceTable from './PostPerformanceTable';
import UserAnalytics from './UserAnalytics';

interface AnalyticsData {
  overview?: any;
  posts?: any;
  engagement?: any;
  aiPerformance?: any;
  trends?: any;
}

export default function AnalyticsContainer() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [period, setPeriod] = useState<string>('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { 
      id: 'overview', 
      name: '概要', 
      icon: <BarChart3 className="w-5 h-5" />,
      description: '全体的なパフォーマンス指標'
    },
    { 
      id: 'posts', 
      name: '投稿分析', 
      icon: <Target className="w-5 h-5" />,
      description: '投稿パフォーマンスの詳細'
    },
    { 
      id: 'engagement', 
      name: 'エンゲージメント', 
      icon: <Heart className="w-5 h-5" />,
      description: 'エンゲージメント傾向分析'
    },
    { 
      id: 'ai_performance', 
      name: 'AI分析', 
      icon: <Zap className="w-5 h-5" />,
      description: 'AI生成コンテンツの効果'
    },
    { 
      id: 'trends', 
      name: 'トレンド', 
      icon: <TrendingUp className="w-5 h-5" />,
      description: '成長トレンドと予測'
    }
  ];

  const periodOptions = [
    { value: '7', label: '過去7日間' },
    { value: '30', label: '過去30日間' },
    { value: '90', label: '過去90日間' },
    { value: '365', label: '過去1年間' }
  ];

  const fetchAnalyticsData = async (type: string, selectedPeriod: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?type=${type}&period=${selectedPeriod}`);
      const data = await response.json();

      if (response.ok) {
        setAnalyticsData(prev => ({
          ...prev,
          [type]: data.data
        }));
        setError('');
      } else {
        setError(data.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(activeTab, period);
  }, [activeTab, period]);

  const handleRefresh = () => {
    fetchAnalyticsData(activeTab, period);
  };

  const handleExportData = () => {
    const dataToExport = analyticsData[activeTab as keyof AnalyticsData];
    if (dataToExport) {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${activeTab}-${period}days-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 データ分析ダッシュボード</h1>
            <p className="text-gray-600">投稿パフォーマンスとエンゲージメントの詳細分析</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 期間選択 */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* アクションボタン */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportData}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              エクスポート
            </motion.button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* タブ説明 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </motion.div>

      {/* エラー表示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-700">❌ {error}</p>
        </motion.div>
      )}

      {/* コンテンツ */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-500">データを読み込み中...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AnalyticsOverview data={analyticsData.overview} period={period} />
            )}
            
            {activeTab === 'posts' && (
              <PostPerformanceTable data={analyticsData.posts} period={period} />
            )}
            
            {activeTab === 'engagement' && (
              <EngagementChart data={analyticsData.engagement} period={period} />
            )}
            
            {activeTab === 'ai_performance' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">AI生成コンテンツ分析</h3>
                {analyticsData.ai_performance ? (
                  <div className="space-y-6">
                    {/* AI vs 手動投稿比較 */}
                    <div>
                      <h4 className="font-medium mb-3">AI生成 vs 手動投稿</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {analyticsData.ai_performance.aiVsManualPosts?.map((item: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900">
                              {item.type === 'ai_generated' ? 'AI生成投稿' : '手動投稿'}
                            </h5>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              <p>投稿数: {item.count}</p>
                              <p>平均ビュー: {Math.round(item.avgViews)}</p>
                              <p>平均エンゲージメント: {Math.round(item.avgEngagements)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* トークン効率性 */}
                    {analyticsData.ai_performance.tokenEfficiency?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">トークン効率性</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-3 text-left">モデル</th>
                                <th className="p-3 text-left">生成数</th>
                                <th className="p-3 text-left">平均トークン</th>
                                <th className="p-3 text-left">平均エンゲージメント</th>
                                <th className="p-3 text-left">効率性</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsData.ai_performance.tokenEfficiency.map((item: any, index: number) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3">{item.model}</td>
                                  <td className="p-3">{item.generations}</td>
                                  <td className="p-3">{Math.round(item.avgTokens)}</td>
                                  <td className="p-3">{Math.round(item.avgEngagements)}</td>
                                  <td className="p-3">{Number(item.engagementPerKToken).toFixed(2)}/1Kトークン</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">データがありません</p>
                )}
              </div>
            )}
            
            {activeTab === 'trends' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">成長トレンド分析</h3>
                {analyticsData.trends ? (
                  <div className="space-y-6">
                    {/* 成長トレンド */}
                    {analyticsData.trends.growthTrends?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">日別成長トレンド</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-3 text-left">日付</th>
                                <th className="p-3 text-left">投稿数</th>
                                <th className="p-3 text-left">ビュー数</th>
                                <th className="p-3 text-left">エンゲージメント</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsData.trends.growthTrends.slice(-10).map((item: any, index: number) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3">{new Date(item.date).toLocaleDateString('ja-JP')}</td>
                                  <td className="p-3">{item.posts}</td>
                                  <td className="p-3">{item.views}</td>
                                  <td className="p-3">{item.engagements}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">データがありません</p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}