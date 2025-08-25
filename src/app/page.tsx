'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  FileText, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  DollarSign,
  Eye,
  BarChart3,
  Settings,
  Bell,
  Monitor
} from 'lucide-react';
import AIGeneratorForm from '@/components/AIGeneratorForm';
import UserManagementContainer from '@/components/UserManagementContainer';
import PostManagementContainer from '@/components/PostManagementContainer';
import ScheduleManagementContainer from '@/components/ScheduleManagementContainer';
import AnalyticsContainer from '@/components/AnalyticsContainer';
import SystemSettingsContainer from '@/components/SystemSettingsContainer';
import UsageMonitoring from '@/components/UsageMonitoring';
import MaintenanceControl from '@/components/MaintenanceControl';
import AlertManagement from '@/components/AlertManagement';
import NotificationCenter from '@/components/NotificationCenter';
import StartupInitializer from '@/components/StartupInitializer';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalGenerations: number;
  totalTokensUsed: number;
  activeSessions: number;
  todayRevenue: number;
  successRate: number;
}

interface Activity {
  id: string;
  type: string;
  action: string;
  details: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalGenerations: 0,
    totalTokensUsed: 0,
    activeSessions: 0,
    todayRevenue: 0,
    successRate: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity?limit=5')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      } else {
        // Fallback to demo data if API fails
        setStats({
          totalUsers: 0,
          totalPosts: 0,
          totalGenerations: 0,
          totalTokensUsed: 0,
          activeSessions: 0,
          todayRevenue: 0,
          successRate: 100
        });
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData.data.activities);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Fallback to demo data
      setStats({
        totalUsers: 0,
        totalPosts: 0,
        totalGenerations: 0,
        totalTokensUsed: 0,
        activeSessions: 0,
        todayRevenue: 0,
        successRate: 100
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'sample' }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}\n\n` +
              `ユーザー: ${result.data.users}件\n` +
              `投稿: ${result.data.posts}件\n` +
              `AI生成: ${result.data.generations}件\n` +
              `スケジュール: ${result.data.schedules}件`);
        
        // Refresh data to show the new seeded data
        await fetchData();
      } else {
        const error = await response.json();
        alert(`❌ データ生成に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Seed data error:', error);
      alert('❌ データ生成中にエラーが発生しました');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      title: '総ユーザー数',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="w-8 h-8 text-blue-400" />,
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: '総投稿数',
      value: stats.totalPosts.toLocaleString(),
      icon: <FileText className="w-8 h-8 text-green-400" />,
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'AI生成数',
      value: stats.totalGenerations.toLocaleString(),
      icon: <Zap className="w-8 h-8 text-purple-400" />,
      change: '+24%',
      changeType: 'positive'
    },
    {
      title: 'トークン使用量',
      value: stats.totalTokensUsed.toLocaleString(),
      icon: <Activity className="w-8 h-8 text-orange-400" />,
      change: '+18%',
      changeType: 'positive'
    },
    {
      title: 'アクティブセッション',
      value: stats.activeSessions.toString(),
      icon: <Eye className="w-8 h-8 text-yellow-400" />,
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: '今日の売上',
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: <DollarSign className="w-8 h-8 text-emerald-400" />,
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: '成功率',
      value: `${stats.successRate}%`,
      icon: <TrendingUp className="w-8 h-8 text-cyan-400" />,
      change: '+0.3%',
      changeType: 'positive'
    },
    {
      title: 'システム状態',
      value: 'オンライン',
      icon: <Shield className="w-8 h-8 text-green-400" />,
      change: '稼働中',
      changeType: 'neutral'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Services Initializer */}
      <StartupInitializer />
      
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">ThreadBot 管理パネル</h1>
              <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30">
                ADMIN ONLY
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm">通知</span>
              </button>
              
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">システム正常</span>
              </div>
              <span className="text-gray-400 text-sm">
                最終更新: {new Date().toLocaleString('ja-JP')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-300 font-semibold">管理者専用サイト</h3>
              <p className="text-red-200 text-sm">
                このサイトは管理者専用です。すべての操作はログに記録されます。
                不正アクセスは法的処罰の対象となります。
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                {card.icon}
                <span className={`text-sm px-2 py-1 rounded-full ${
                  card.changeType === 'positive' 
                    ? 'bg-green-500/20 text-green-300' 
                    : card.changeType === 'negative'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {card.change}
                </span>
              </div>
              <h3 className="text-gray-300 text-sm mb-2">{card.title}</h3>
              <p className="text-white text-2xl font-bold">
                {loading ? '...' : card.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ダッシュボードコンテンツ */}
        {activeSection === 'dashboard' && (
          <>
            {/* AI Generator */}
            <AIGeneratorForm onGenerate={(result) => {
              // AI生成後にデータを再読み込み
              fetchData();
            }} />

            {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-6 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('users')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Users className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">ユーザー管理</h3>
            <p className="text-blue-100 text-sm">ユーザーアカウントの表示・編集・削除</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('posts')}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <FileText className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">投稿管理</h3>
            <p className="text-green-100 text-sm">投稿の監視・削除・統計表示</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('analytics')}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <BarChart3 className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">データ分析</h3>
            <p className="text-indigo-100 text-sm">投稿パフォーマンスと統計分析</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('schedules')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Activity className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">スケジュール管理</h3>
            <p className="text-purple-100 text-sm">定期投稿・自動実行の設定</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSeedData}
            disabled={seeding}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {seeding ? 'データ生成中...' : 'テストデータ生成'}
            </h3>
            <p className="text-orange-100 text-sm">開発・テスト用のサンプルデータを作成</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('settings')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Settings className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">システム設定</h3>
            <p className="text-gray-100 text-sm">システムの動作とセキュリティ設定</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('usage')}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Monitor className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">使用量監視</h3>
            <p className="text-cyan-100 text-sm">API使用量とトークン消費の監視</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('maintenance')}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Shield className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">メンテナンス</h3>
            <p className="text-red-100 text-sm">システム全体のメンテナンス制御</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('alerts')}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white p-6 rounded-2xl text-left transition-all duration-300 shadow-lg"
          >
            <Bell className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">アラート管理</h3>
            <p className="text-yellow-100 text-sm">通知とアラートルールの管理</p>
          </motion.button>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            最近のアクティビティ
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">まだアクティビティがありません</p>
                <p className="text-gray-500 text-sm mt-2">ユーザーアクティビティがここに表示されます</p>
              </div>
            ) : (
              activities.map((activity) => {
                const getTimeAgo = (timestamp: string) => {
                  const now = new Date();
                  const time = new Date(timestamp);
                  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
                  
                  if (diffInMinutes < 1) return '今';
                  if (diffInMinutes < 60) return `${diffInMinutes}分前`;
                  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
                  return `${Math.floor(diffInMinutes / 1440)}日前`;
                };

                const getIconColor = (color: string) => {
                  switch(color) {
                    case 'blue': return 'bg-blue-400';
                    case 'green': return 'bg-green-400';
                    case 'red': return 'bg-red-400';
                    case 'purple': return 'bg-purple-400';
                    case 'yellow': return 'bg-yellow-400';
                    default: return 'bg-gray-400';
                  }
                };

                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
                    <div className={`w-2 h-2 ${getIconColor(activity.color)} rounded-full`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-medium">{activity.action}</span>
                        <span className="text-gray-400 text-sm">{getTimeAgo(activity.timestamp)}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{activity.details}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
          </>
        )}

        {/* セクション切り替え */}
        {activeSection === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <UserManagementContainer />
          </motion.div>
        )}

        {activeSection === 'posts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <PostManagementContainer />
          </motion.div>
        )}

        {activeSection === 'schedules' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <ScheduleManagementContainer />
          </motion.div>
        )}

        {activeSection === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <AnalyticsContainer />
          </motion.div>
        )}

        {activeSection === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <SystemSettingsContainer />
          </motion.div>
        )}

        {activeSection === 'usage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <UsageMonitoring />
          </motion.div>
        )}

        {activeSection === 'maintenance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <MaintenanceControl />
          </motion.div>
        )}

        {activeSection === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-yellow-600 hover:text-yellow-800 font-medium transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
            <AlertManagement />
          </motion.div>
        )}

        <div className="text-center text-gray-400 text-sm mt-8">
          🤖 ThreadBot Admin Panel v1.0
        </div>
      </main>

      {/* 通知センター */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
