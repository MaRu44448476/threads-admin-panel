'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface SchedulerStatus {
  isRunning: boolean;
  lastCheck: string;
}

interface WorkerStatus {
  isRunning: boolean;
  checkInterval: number;
  lastCheck: string;
}

interface ExecutionResult {
  scheduleId: string;
  success: boolean;
  message: string;
  error?: string;
  postId?: string;
  threadsPostId?: string;
}

interface UpcomingSchedule {
  id: string;
  name: string;
  nextRun: string;
  frequency: string;
  user: {
    name: string;
    email: string;
  };
}

interface RecentExecution {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function SchedulerControl() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [lastExecutionResults, setLastExecutionResults] = useState<ExecutionResult[]>([]);

  const fetchStatus = async () => {
    try {
      const [schedulerResponse, workerResponse] = await Promise.all([
        fetch('/api/admin/scheduler'),
        fetch('/api/startup')
      ]);
      
      const schedulerData = await schedulerResponse.json();
      const workerData = await workerResponse.json();

      if (schedulerResponse.ok) {
        setStatus(schedulerData.data.status);
        setUpcomingSchedules(schedulerData.data.upcomingSchedules || []);
        setRecentExecutions(schedulerData.data.recentExecutions || []);
      } else {
        setError(schedulerData.error || 'スケジューラー情報の取得に失敗しました');
      }

      if (workerResponse.ok) {
        setWorkerStatus(workerData.worker);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Scheduler status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeSchedules = async () => {
    setExecuting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'execute_now' }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastExecutionResults(data.data.results || []);
        const summary = data.data.summary;
        alert(`✅ スケジュール実行完了\n\n総数: ${summary.total}\n成功: ${summary.successful}\n失敗: ${summary.failed}`);
        
        // 状態を再取得
        await fetchStatus();
      } else {
        setError(data.error || 'スケジュール実行に失敗しました');
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Schedule execution error:', err);
      alert('❌ ネットワークエラーが発生しました');
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // 30秒ごとに状態を更新
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilNext = (nextRun: string) => {
    const next = new Date(nextRun);
    const now = new Date();
    const diffMs = next.getTime() - now.getTime();
    
    if (diffMs < 0) return '期限切れ';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return `${diffMinutes}分後`;
    } else if (diffHours < 24) {
      return `${diffHours}時間後`;
    } else {
      return `${Math.floor(diffHours / 24)}日後`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-500">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* スケジューラー制御パネル */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">スケジューラー制御</h2>
              <p className="text-gray-600 text-sm">自動実行システムの監視と制御</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchStatus}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              更新
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={executeSchedules}
              disabled={executing || status?.isRunning}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  実行中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  今すぐ実行
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">❌ {error}</p>
          </div>
        )}

        {/* ステータス表示 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {status?.isRunning ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Square className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-medium text-blue-900">実行状態</span>
            </div>
            <p className="text-sm text-blue-700">
              {status?.isRunning ? '実行中' : 'アイドル'}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">最終チェック</span>
            </div>
            <p className="text-sm text-green-700">
              {status?.lastCheck ? formatDate(status.lastCheck) : '未実行'}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">待機中</span>
            </div>
            <p className="text-sm text-purple-700">
              {upcomingSchedules.length}件のスケジュール
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {workerStatus?.isRunning ? (
                <Activity className="w-5 h-5 text-orange-600 animate-pulse" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              )}
              <span className="font-medium text-orange-900">背景ワーカー</span>
            </div>
            <p className="text-sm text-orange-700">
              {workerStatus?.isRunning ? '自動実行中' : '停止中'}
            </p>
            {workerStatus?.checkInterval && (
              <p className="text-xs text-orange-600 mt-1">
                チェック間隔: {Math.floor(workerStatus.checkInterval / 1000)}秒
              </p>
            )}
          </div>
        </div>

        {/* 最新実行結果 */}
        {lastExecutionResults.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">最新実行結果</h3>
            <div className="space-y-2">
              {lastExecutionResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                  {result.threadsPostId && (
                    <p className="text-xs text-gray-600 mt-1">
                      投稿ID: {result.threadsPostId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 次回実行予定 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          次回実行予定
        </h3>
        
        {upcomingSchedules.length === 0 ? (
          <p className="text-gray-500 text-center py-4">実行予定のスケジュールはありません</p>
        ) : (
          <div className="space-y-3">
            {upcomingSchedules.map((schedule) => (
              <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                    <p className="text-sm text-gray-600">
                      作成者: {schedule.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(schedule.nextRun)}
                    </p>
                    <p className="text-xs text-blue-600">
                      {getTimeUntilNext(schedule.nextRun)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 実行履歴 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          実行履歴
        </h3>
        
        {recentExecutions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">実行履歴がありません</p>
        ) : (
          <div className="space-y-2">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {execution.action.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-600">{execution.details}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(execution.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}