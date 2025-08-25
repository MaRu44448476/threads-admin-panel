'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  PlayCircle
} from 'lucide-react';

interface Schedule {
  id: string;
  name: string;
  time: string;
  frequency: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduleManagementProps {
  onScheduleAction?: (action: string, schedule?: Schedule) => void;
}

export default function ScheduleManagement({ onScheduleAction }: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // フィルター・検索
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const itemsPerPage = 10;

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (frequencyFilter) params.append('frequency', frequencyFilter);
      if (statusFilter) params.append('isActive', statusFilter);

      const response = await fetch(`/api/admin/schedules?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSchedules(data.data.schedules);
        setTotalPages(data.data.pagination.totalPages);
        setTotalSchedules(data.data.pagination.total);
      } else {
        setError(data.error || 'スケジュール一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Schedules fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentPage, searchTerm, frequencyFilter, statusFilter]);

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      once: 'bg-gray-100 text-gray-800 border-gray-200',
      daily: 'bg-blue-100 text-blue-800 border-blue-200',
      weekly: 'bg-green-100 text-green-800 border-green-200',
      monthly: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const labels = {
      once: '一度のみ',
      daily: '毎日',
      weekly: '毎週',
      monthly: '毎月'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[frequency as keyof typeof colors] || colors.once}`}>
        <Calendar className="w-3 h-3" />
        {labels[frequency as keyof typeof labels] || frequency}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3" />
        有効
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle className="w-3 h-3" />
        無効
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextRunStatus = (nextRun?: string) => {
    if (!nextRun) return null;
    
    const next = new Date(nextRun);
    const now = new Date();
    const diffMs = next.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return <span className="text-red-600 text-xs">期限切れ</span>;
    } else if (diffHours < 1) {
      return <span className="text-orange-600 text-xs">1時間以内</span>;
    } else if (diffHours < 24) {
      return <span className="text-yellow-600 text-xs">{diffHours}時間後</span>;
    } else {
      return <span className="text-green-600 text-xs">{diffDays}日後</span>;
    }
  };

  const handleScheduleAction = async (schedule: Schedule, action: string) => {
    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchSchedules(); // データを再読み込み
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert('❌ ネットワークエラーが発生しました');
      console.error('Schedule action error:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">スケジュール管理</h2>
            <p className="text-gray-600 text-sm">総スケジュール数: {totalSchedules}件</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onScheduleAction?.('create')}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規スケジュール
        </motion.button>
      </div>

      {/* フィルター・検索 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="スケジュール名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">すべての頻度</option>
          <option value="once">一度のみ</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週</option>
          <option value="monthly">毎月</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">すべてのステータス</option>
          <option value="true">有効</option>
          <option value="false">無効</option>
        </select>
        
        <button
          onClick={() => {
            setSearchTerm('');
            setFrequencyFilter('');
            setStatusFilter('');
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          リセット
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      {/* スケジュールテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">スケジュール名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">頻度</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">実行状況</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">次回実行</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">作成者</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">スケジュールが見つかりません</p>
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <motion.tr
                  key={schedule.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-sm text-gray-500">
                        実行時刻: {formatTime(schedule.time)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getFrequencyBadge(schedule.frequency)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(schedule.isActive)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>{schedule.runCount}回実行</span>
                      </div>
                      {schedule.lastRun && (
                        <p className="text-xs text-gray-500 mt-1">
                          最終: {formatDate(schedule.lastRun)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {schedule.nextRun ? (
                      <div>
                        <p className="text-sm text-gray-900">
                          {formatDate(schedule.nextRun)}
                        </p>
                        {getNextRunStatus(schedule.nextRun)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">未設定</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{schedule.user.name}</p>
                        <p className="text-xs text-gray-500">{schedule.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* ステータス変更ボタン */}
                      {schedule.isActive ? (
                        <button
                          onClick={() => handleScheduleAction(schedule, 'deactivate')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="無効化"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleScheduleAction(schedule, 'activate')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="有効化"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleScheduleAction(schedule, 'run_now')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="今すぐ実行"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleScheduleAction(schedule, 'reset')}
                        className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="リセット"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onScheduleAction?.('view', schedule)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="詳細"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onScheduleAction?.('edit', schedule)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onScheduleAction?.('delete', schedule)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            {totalSchedules}件中 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalSchedules)}件を表示
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}