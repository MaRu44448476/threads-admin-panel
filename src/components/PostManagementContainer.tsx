'use client';

import { useState } from 'react';
import PostManagement from './PostManagement';
import PostModals from './PostModals';

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

export default function PostManagementContainer() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedPost(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <PostManagement
        key={refreshTrigger} // リフレッシュトリガー
        onPostAction={(action, post) => {
          switch (action) {
            case 'create':
              setShowCreateModal(true);
              break;
            case 'edit':
              setSelectedPost(post || null);
              setShowEditModal(true);
              break;
            case 'delete':
              setSelectedPost(post || null);
              setShowDeleteModal(true);
              break;
            case 'view':
              // 詳細表示の実装（今回は省略）
              console.log('View post:', post);
              break;
          }
        }}
      />

      <PostModals
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedPost={selectedPost}
        onClose={handleCloseModals}
        onPostCreated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onPostUpdated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onPostDeleted={() => {
          handleCloseModals();
          triggerRefresh();
        }}
      />
    </div>
  );
}