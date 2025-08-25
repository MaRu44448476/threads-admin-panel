'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, AlertTriangle, Clock, Calendar, Repeat, User } from 'lucide-react';

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
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduleModalsProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  selectedSchedule: Schedule | null;
  onClose: () => void;
  onScheduleCreated: () => void;
  onScheduleUpdated: () => void;
  onScheduleDeleted: () => void;
}

export default function ScheduleModals({
  showCreateModal,
  showEditModal,
  showDeleteModal,
  selectedSchedule,
  onClose,
  onScheduleCreated,
  onScheduleUpdated,
  onScheduleDeleted
}: ScheduleModalsProps) {
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    frequency: 'daily',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      time: '',
      frequency: 'daily',
      isActive: true
    });
    setError('');
  };

  // 編集モーダル開放時にデータを設定
  useEffect(() => {
    if (showEditModal && selectedSchedule) {
      // ISO文字列をdatetime-localフォーマットに変換
      const timeValue = new Date(selectedSchedule.time).toISOString().slice(0, 16);
      
      setFormData({
        name: selectedSchedule.name,
        time: timeValue,
        frequency: selectedSchedule.frequency,
        isActive: selectedSchedule.isActive
      });
    } else if (showCreateModal) {
      resetForm();
    }
  }, [showEditModal, showCreateModal, selectedSchedule]);

  // スケジュール作成
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.time || !formData.frequency) {
      setError('名前、時間、頻度は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          time: formData.time,
          frequency: formData.frequency,
          isActive: formData.isActive
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ スケジュールが正常に作成されました');
        onScheduleCreated();
        onClose();
        resetForm();
      } else {
        setError(data.error || 'スケジュールの作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Schedule creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // スケジュール更新
  const handleUpdate = async () => {
    if (!selectedSchedule || !formData.name.trim() || !formData.time || !formData.frequency) {
      setError('名前、時間、頻度は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/schedules/${selectedSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          time: formData.time,
          frequency: formData.frequency,
          isActive: formData.isActive
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ スケジュールが正常に更新されました');
        onScheduleUpdated();
        onClose();
      } else {
        setError(data.error || 'スケジュールの更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Schedule update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // スケジュール削除
  const handleDelete = async () => {
    if (!selectedSchedule) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/schedules/${selectedSchedule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ スケジュールが正常に削除されました');
        onScheduleDeleted();
        onClose();
      } else {
        setError(data.error || 'スケジュールの削除に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Schedule deletion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <>
      {/* 作成モーダル */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">新規スケジュール作成</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    スケジュール名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="例: 毎日の投稿、週次レポート"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    実行日時 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Repeat className="w-4 h-4 inline mr-1" />
                    実行頻度 *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="once">一度のみ</option>
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    作成後すぐに有効化
                  </label>
                </div>

                {/* 頻度の説明 */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>頻度の説明:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• 一度のみ: 指定した日時に1回のみ実行</li>
                    <li>• 毎日: 指定した時刻に毎日実行</li>
                    <li>• 毎週: 指定した曜日・時刻に毎週実行</li>
                    <li>• 毎月: 指定した日・時刻に毎月実行</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? '作成中...' : '作成'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 編集モーダル */}
      <AnimatePresence>
        {showEditModal && selectedSchedule && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">スケジュール編集</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    スケジュール名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    実行日時 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Repeat className="w-4 h-4 inline mr-1" />
                    実行頻度 *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="once">一度のみ</option>
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                    スケジュールを有効化
                  </label>
                </div>

                {/* 現在の実行状況表示 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">現在の実行状況</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>実行回数:</span>
                      <span className="font-medium">{selectedSchedule.runCount}回</span>
                    </div>
                    {selectedSchedule.lastRun && (
                      <div className="flex justify-between text-sm">
                        <span>最終実行:</span>
                        <span className="font-medium">
                          {new Date(selectedSchedule.lastRun).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    )}
                    {selectedSchedule.nextRun && (
                      <div className="flex justify-between text-sm">
                        <span>次回実行:</span>
                        <span className="font-medium">
                          {new Date(selectedSchedule.nextRun).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? '更新中...' : '更新'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {showDeleteModal && selectedSchedule && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">スケジュール削除の確認</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  以下のスケジュールを削除してもよろしいですか？この操作は取り消せません。
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedSchedule.name}</p>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>頻度: {selectedSchedule.frequency}</p>
                    <p>実行回数: {selectedSchedule.runCount}回</p>
                    <p>ステータス: {selectedSchedule.isActive ? '有効' : '無効'}</p>
                    {selectedSchedule.nextRun && (
                      <p>次回実行: {new Date(selectedSchedule.nextRun).toLocaleString('ja-JP')}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {loading ? '削除中...' : '削除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}