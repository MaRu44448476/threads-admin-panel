'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Zap,
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  TestTube,
  Trash2,
  Clock
} from 'lucide-react';

interface UsageSummary {
  api: {
    hourly: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
    daily: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
  };
  tokens: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    generations: number;
  };
  timestamp: string;
}

interface UsageStats {
  endpoint: string;
  method: string;
  count: number;
  period: string;
  lastUsed: string;
}

export default function UsageMonitoring() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'stats' | 'history'>('summary');
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  const fetchData = async (type: string = 'summary') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', type);
      if (type === 'stats') params.append('period', period);

      const response = await fetch(`/api/admin/usage?${params}`);
      const data = await response.json();

      if (response.ok) {
        if (type === 'summary') {
          setSummary(data.data);
        } else if (type === 'stats') {
          setStats(data.data.statistics || []);
        }
        setError('');
      } else {
        setError(data.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Usage data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, data: any = {}) => {
    try {
      const response = await fetch('/api/admin/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message || 'アクションが完了しました'}`);
        fetchData(activeTab);
      } else {
        alert(`❌ ${result.error || 'アクションが失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Usage action error:', err);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, period]);

  // 自動更新（30秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'summary') {
        fetchData('summary');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 50) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading && !summary && stats.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">使用量データを読み込み中...</span>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              API使用量監視
            </h1>
            <p className="text-gray-600">システムのAPI使用量とトークン消費を監視</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(activeTab)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>

            <button
              onClick={() => handleAction('generate_test_usage')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              テストデータ生成
            </button>

            <button
              onClick={() => handleAction('clear_cache')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              キャッシュクリア
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { id: 'summary', name: '概要', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'stats', name: '統計', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'history', name: '履歴', icon: <Clock className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}
      </motion.div>

      {/* 使用量サマリー */}
      {activeTab === 'summary' && summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* API使用量 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              API使用量
            </h3>
            
            <div className="space-y-4">
              {/* 1時間あたり */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">1時間あたり</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(summary.api.hourly.percentage)}`}>
                    {summary.api.hourly.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(summary.api.hourly.percentage)}`}
                    style={{ width: `${Math.min(summary.api.hourly.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{summary.api.hourly.used} / {summary.api.hourly.limit}</span>
                  <span>残り: {summary.api.hourly.remaining}</span>
                </div>
              </div>

              {/* 1日あたり */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">1日あたり</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(summary.api.daily.percentage)}`}>
                    {summary.api.daily.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(summary.api.daily.percentage)}`}
                    style={{ width: `${Math.min(summary.api.daily.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{summary.api.daily.used} / {summary.api.daily.limit}</span>
                  <span>残り: {summary.api.daily.remaining}</span>
                </div>
              </div>
            </div>
          </div>

          {/* トークン使用量 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              トークン使用量
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">本日の使用量</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(summary.tokens.percentage)}`}>
                    {summary.tokens.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getUsageBarColor(summary.tokens.percentage)}`}
                    style={{ width: `${Math.min(summary.tokens.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{summary.tokens.used.toLocaleString()} / {summary.tokens.limit.toLocaleString()}</span>
                  <span>残り: {summary.tokens.remaining.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{summary.tokens.generations}</div>
                    <div className="text-sm text-gray-600">AI生成回数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {summary.tokens.generations > 0 ? Math.round(summary.tokens.used / summary.tokens.generations) : 0}
                    </div>
                    <div className="text-sm text-gray-600">平均トークン/生成</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 統計 */}
      {activeTab === 'stats' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">API使用統計</h3>
            
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hour">過去1時間</option>
              <option value="day">過去1日</option>
              <option value="week">過去1週間</option>
              <option value="month">過去1ヶ月</option>
            </select>
          </div>

          {stats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">統計データがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">エンドポイント</th>
                    <th className="p-3 text-center">メソッド</th>
                    <th className="p-3 text-center">使用回数</th>
                    <th className="p-3 text-center">最終使用</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{stat.endpoint}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stat.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          stat.method === 'POST' ? 'bg-green-100 text-green-800' :
                          stat.method === 'PATCH' ? 'bg-yellow-100 text-yellow-800' :
                          stat.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stat.method}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold">{stat.count}</td>
                      <td className="p-3 text-center text-gray-600">
                        {new Date(stat.lastUsed).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* 使用量アラート */}
      {summary && (summary.api.hourly.percentage > 80 || summary.tokens.percentage > 80) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h4 className="text-yellow-800 font-semibold">使用量警告</h4>
              <p className="text-yellow-700 text-sm">
                API使用量またはトークン使用量が制限の80%を超えています。制限に注意してください。
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}