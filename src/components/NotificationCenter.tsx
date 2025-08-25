'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  X,
  Check,
  CheckAll,
  Trash2,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  isRead: boolean;
  readAt?: string;
  data?: string;
  userId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function NotificationCenter({ isOpen, onClose, className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    type?: string;
    unreadOnly: boolean;
    category?: string;
  }>({
    unreadOnly: false
  });
  const [error, setError] = useState('');

  const typeIcons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />
  };

  const priorityColors = {
    low: 'border-l-gray-400',
    normal: 'border-l-blue-400',
    high: 'border-l-yellow-400',
    urgent: 'border-l-red-400'
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.unreadOnly) params.append('unreadOnly', 'true');
      if (filter.category) params.append('category', filter.category);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/notifications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.data.notifications);
        setError('');
      } else {
        setError(data.error || '通知の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read'
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            isRead: true, 
            readAt: new Date().toISOString() 
          }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const createTestNotification = async () => {
    try {
      const testNotifications = [
        {
          title: 'システム情報',
          message: 'バックグラウンドワーカーが正常に動作しています',
          type: 'info',
          category: 'system'
        },
        {
          title: 'スケジュール実行',
          message: '2件のスケジュールが正常に実行されました',
          type: 'success',
          category: 'schedule'
        },
        {
          title: 'API制限警告',
          message: 'API使用量が制限の80%に達しました',
          type: 'warning',
          priority: 'high',
          category: 'api'
        }
      ];

      const randomNotif = testNotifications[Math.floor(Math.random() * testNotifications.length)];

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(randomNotif),
      });

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to create test notification:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end ${className}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="bg-white w-96 h-full shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">通知センター</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
              
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <CheckAll className="w-4 h-4" />
                すべて既読
              </button>

              <button
                onClick={createTestNotification}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                テスト
              </button>
            </div>

            {/* フィルター */}
            <div className="mt-3 flex items-center gap-2">
              <select
                value={filter.type || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="">すべてのタイプ</option>
                <option value="info">情報</option>
                <option value="success">成功</option>
                <option value="warning">警告</option>
                <option value="error">エラー</option>
              </select>

              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={filter.unreadOnly}
                  onChange={(e) => setFilter(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                />
                未読のみ
              </label>
            </div>
          </div>

          {/* 通知リスト */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">読み込み中...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mb-2" />
                <p>通知がありません</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 border-l-4 ${priorityColors[notification.priority]} ${
                      !notification.isRead 
                        ? 'bg-blue-50 border-b border-blue-100' 
                        : 'bg-white border-b border-gray-100'
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {typeIcons[notification.type]}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{new Date(notification.createdAt).toLocaleString('ja-JP')}</span>
                            {notification.category && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {notification.category}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                              notification.priority === 'high' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="既読にする"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}