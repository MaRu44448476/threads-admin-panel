'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Send,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';

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
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PostManagementProps {
  onPostAction?: (action: string, post?: Post) => void;
}

export default function PostManagement({ onPostAction }: PostManagementProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // フィルター・検索
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const itemsPerPage = 10;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (userFilter) params.append('userId', userFilter);

      const response = await fetch(`/api/admin/posts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.totalPages);
        setTotalPosts(data.data.pagination.total);
      } else {
        setError(data.error || '投稿一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Posts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchTerm, statusFilter, userFilter]);

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      draft: <PauseCircle className="w-3 h-3" />,
      scheduled: <Clock className="w-3 h-3" />,
      published: <PlayCircle className="w-3 h-3" />,
      failed: <Trash2 className="w-3 h-3" />
    };

    const labels = {
      draft: '下書き',
      scheduled: 'スケジュール済み',
      published: '公開済み',
      failed: '失敗'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.draft}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
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

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const handleStatusChange = async (post: Post, action: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchPosts(); // データを再読み込み
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert('❌ ネットワークエラーが発生しました');
      console.error('Status update error:', err);
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
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">投稿管理</h2>
            <p className="text-gray-600 text-sm">総投稿数: {totalPosts}件</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPostAction?.('create')}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規投稿
        </motion.button>
      </div>

      {/* フィルター・検索 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="投稿内容で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">すべてのステータス</option>
          <option value="draft">下書き</option>
          <option value="scheduled">スケジュール済み</option>
          <option value="published">公開済み</option>
          <option value="failed">失敗</option>
        </select>
        
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">すべてのユーザー</option>
          <option value="admin-system">システム</option>
          {/* 実際のユーザーリストは別途取得 */}
        </select>
        
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
            setUserFilter('');
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

      {/* 投稿テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">投稿内容</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">投稿者</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">エンゲージメント</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">日時</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">投稿が見つかりません</p>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs">
                    <div>
                      <p className="text-gray-900 text-sm leading-relaxed">
                        {truncateContent(post.content)}
                      </p>
                      {post.threadsPostId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Threads ID: {post.threadsPostId}
                        </p>
                      )}
                      {post.error && (
                        <p className="text-xs text-red-600 mt-1">
                          エラー: {post.error}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(post.status)}
                    {post.scheduledFor && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.scheduledFor)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{post.user.name}</p>
                        <p className="text-xs text-gray-500">{post.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{post.engagements}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {post.publishedAt ? '公開' : '作成'}
                      </p>
                      <p>{formatDate(post.publishedAt || post.createdAt)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* ステータス変更ボタン */}
                      {post.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(post, 'publish')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="公開"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      
                      {post.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(post, 'unpublish')}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="非公開"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onPostAction?.('view', post)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="詳細"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPostAction?.('edit', post)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPostAction?.('delete', post)}
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
            {totalPosts}件中 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalPosts)}件を表示
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
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