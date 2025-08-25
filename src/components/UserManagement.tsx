'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
    generations: number;
    schedules: number;
  };
  threadsAccount?: {
    username: string;
    isActive: boolean;
  };
}

interface UserManagementProps {
  onUserAction?: (action: string, user?: User) => void;
}

export default function UserManagement({ onUserAction }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // フィルター・検索
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
        setTotalUsers(data.data.pagination.total);
      } else {
        setError(data.error || 'ユーザー一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      moderator: 'bg-blue-100 text-blue-800 border-blue-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors] || colors.user}`}>
        {getRoleIcon(role)}
        {role}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <UserCheck className="w-3 h-3" />
        アクティブ
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <UserX className="w-3 h-3" />
        非アクティブ
      </span>
    );
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ユーザー管理</h2>
            <p className="text-gray-600 text-sm">総ユーザー数: {totalUsers}人</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onUserAction?.('create')}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規ユーザー
        </motion.button>
      </div>

      {/* フィルター・検索 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="名前・メールで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">すべてのロール</option>
          <option value="admin">管理者</option>
          <option value="moderator">モデレーター</option>
          <option value="user">ユーザー</option>
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="inactive">非アクティブ</option>
        </select>
        
        <button
          onClick={() => {
            setSearchTerm('');
            setRoleFilter('');
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

      {/* ユーザーテーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">ユーザー</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ロール</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">投稿数</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">登録日</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">ユーザーが見つかりません</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.threadsAccount && (
                        <p className="text-xs text-blue-600">@{user.threadsAccount.username}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(user.isActive)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <p>投稿: {user._count.posts}</p>
                      <p>AI生成: {user._count.generations}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUserAction?.('view', user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="詳細"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onUserAction?.('edit', user)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onUserAction?.('delete', user)}
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
            {totalUsers}件中 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalUsers)}件を表示
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
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