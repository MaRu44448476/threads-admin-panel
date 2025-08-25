'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, AlertTriangle, User, Mail, Lock, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    posts: number;
    generations: number;
    schedules: number;
  };
}

interface UserModalsProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  selectedUser: User | null;
  onClose: () => void;
  onUserCreated: () => void;
  onUserUpdated: () => void;
  onUserDeleted: () => void;
}

export default function UserModals({
  showCreateModal,
  showEditModal,
  showDeleteModal,
  selectedUser,
  onClose,
  onUserCreated,
  onUserUpdated,
  onUserDeleted
}: UserModalsProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // フォームリセット
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      isActive: true
    });
    setError('');
  };

  // 編集モーダル開放時にデータを設定
  useEffect(() => {
    if (showEditModal && selectedUser) {
      setFormData({
        email: selectedUser.email,
        name: selectedUser.name,
        password: '', // パスワードは空にしておく
        role: selectedUser.role,
        isActive: selectedUser.isActive
      });
    } else if (showCreateModal) {
      resetForm();
    }
  }, [showEditModal, showCreateModal, selectedUser]);

  // ユーザー作成
  const handleCreate = async () => {
    if (!formData.email || !formData.name) {
      setError('メールアドレスと名前は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ユーザーが正常に作成されました');
        onUserCreated();
        onClose();
        resetForm();
      } else {
        setError(data.error || 'ユーザーの作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('User creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー更新
  const handleUpdate = async () => {
    if (!selectedUser || !formData.email || !formData.name) {
      setError('メールアドレスと名前は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = { ...formData };
      // パスワードが空の場合は送信しない
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ユーザー情報が正常に更新されました');
        onUserUpdated();
        onClose();
      } else {
        setError(data.error || 'ユーザーの更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('User update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー削除
  const handleDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ユーザーが正常に削除されました');
        onUserDeleted();
        onClose();
      } else {
        setError(data.error || 'ユーザーの削除に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('User deletion error:', err);
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
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">新規ユーザー作成</h3>
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
                    <Mail className="w-4 h-4 inline mr-1" />
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    名前 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ユーザー名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    パスワード
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="パスワード（任意）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    ロール
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="user">ユーザー</option>
                    <option value="moderator">モデレーター</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    アクティブユーザー
                  </label>
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
        {showEditModal && selectedUser && (
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">ユーザー編集</h3>
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
                    <Mail className="w-4 h-4 inline mr-1" />
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    名前 *
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
                    <Lock className="w-4 h-4 inline mr-1" />
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="変更しない場合は空のまま"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 inline mr-1" />
                    ロール
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">ユーザー</option>
                    <option value="moderator">モデレーター</option>
                    <option value="admin">管理者</option>
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
                    アクティブユーザー
                  </label>
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
        {showDeleteModal && selectedUser && (
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
                <h3 className="text-lg font-semibold text-gray-900">ユーザー削除の確認</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  以下のユーザーを削除してもよろしいですか？この操作は取り消せません。
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>投稿数: {selectedUser._count.posts}</p>
                    <p>AI生成数: {selectedUser._count.generations}</p>
                    <p>スケジュール数: {selectedUser._count.schedules}</p>
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