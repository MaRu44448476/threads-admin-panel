'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, AlertTriangle, FileText, Clock, Send, Calendar, MessageSquare } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  views: number;
  engagements: number;
  threadsPostId?: string;
  error?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PostModalsProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  selectedPost: Post | null;
  onClose: () => void;
  onPostCreated: () => void;
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

export default function PostModals({
  showCreateModal,
  showEditModal,
  showDeleteModal,
  selectedPost,
  onClose,
  onPostCreated,
  onPostUpdated,
  onPostDeleted
}: PostModalsProps) {
  const [formData, setFormData] = useState({
    content: '',
    publishNow: false,
    scheduledFor: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // フォームリセット
  const resetForm = () => {
    setFormData({
      content: '',
      publishNow: false,
      scheduledFor: ''
    });
    setError('');
  };

  // 編集モーダル開放時にデータを設定
  useEffect(() => {
    if (showEditModal && selectedPost) {
      setFormData({
        content: selectedPost.content,
        publishNow: false,
        scheduledFor: selectedPost.scheduledFor 
          ? new Date(selectedPost.scheduledFor).toISOString().slice(0, 16)
          : ''
      });
    } else if (showCreateModal) {
      resetForm();
    }
  }, [showEditModal, showCreateModal, selectedPost]);

  // 投稿作成
  const handleCreate = async () => {
    if (!formData.content.trim()) {
      setError('投稿内容は必須です');
      return;
    }

    if (formData.content.length > 500) {
      setError('投稿内容は500文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData: any = {
        content: formData.content.trim(),
        publishNow: formData.publishNow
      };

      if (!formData.publishNow && formData.scheduledFor) {
        requestData.scheduledFor = formData.scheduledFor;
      }

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ 投稿が正常に作成されました');
        onPostCreated();
        onClose();
        resetForm();
      } else {
        setError(data.error || '投稿の作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Post creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 投稿更新
  const handleUpdate = async () => {
    if (!selectedPost || !formData.content.trim()) {
      setError('投稿内容は必須です');
      return;
    }

    if (formData.content.length > 500) {
      setError('投稿内容は500文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData: any = {
        content: formData.content.trim(),
        publishNow: formData.publishNow
      };

      if (!formData.publishNow && formData.scheduledFor) {
        updateData.scheduledFor = formData.scheduledFor;
      }

      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ 投稿が正常に更新されました');
        onPostUpdated();
        onClose();
      } else {
        setError(data.error || '投稿の更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Post update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 投稿削除
  const handleDelete = async () => {
    if (!selectedPost) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ 投稿が正常に削除されました');
        onPostDeleted();
        onClose();
      } else {
        setError(data.error || '投稿の削除に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Post deletion error:', err);
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
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">新規投稿作成</h3>
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
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    投稿内容 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="投稿内容を入力してください..."
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.content.length}/500文字
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="publishNow"
                      checked={formData.publishNow}
                      onChange={(e) => setFormData({ ...formData, publishNow: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="publishNow" className="text-sm text-gray-700 flex items-center gap-1">
                      <Send className="w-4 h-4" />
                      すぐに公開
                    </label>
                  </div>

                  {!formData.publishNow && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        スケジュール
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}
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
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        {showEditModal && selectedPost && (
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
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">投稿編集</h3>
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
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    投稿内容 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.content.length}/500文字
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="publishNowEdit"
                      checked={formData.publishNow}
                      onChange={(e) => setFormData({ ...formData, publishNow: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="publishNowEdit" className="text-sm text-gray-700 flex items-center gap-1">
                      <Send className="w-4 h-4" />
                      すぐに公開
                    </label>
                  </div>

                  {!formData.publishNow && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        スケジュール
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 現在のステータス表示 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">現在のステータス</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{selectedPost.status}</span>
                    {selectedPost.publishedAt && (
                      <span className="text-xs text-gray-500">
                        公開: {new Date(selectedPost.publishedAt).toLocaleString('ja-JP')}
                      </span>
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
        {showDeleteModal && selectedPost && (
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
                <h3 className="text-lg font-semibold text-gray-900">投稿削除の確認</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  以下の投稿を削除してもよろしいですか？この操作は取り消せません。
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {selectedPost.content.length > 150 
                      ? selectedPost.content.substring(0, 150) + '...' 
                      : selectedPost.content}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>ステータス: {selectedPost.status}</p>
                    <p>ビュー数: {selectedPost.views}</p>
                    <p>エンゲージメント: {selectedPost.engagements}</p>
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