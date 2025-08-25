'use client';

import { useState } from 'react';
import UserManagement from './UserManagement';
import UserModals from './UserModals';

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

export default function UserManagementContainer() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <UserManagement
        key={refreshTrigger} // リフレッシュトリガー
        onUserAction={(action, user) => {
          switch (action) {
            case 'create':
              setShowCreateModal(true);
              break;
            case 'edit':
              setSelectedUser(user || null);
              setShowEditModal(true);
              break;
            case 'delete':
              setSelectedUser(user || null);
              setShowDeleteModal(true);
              break;
          }
        }}
      />

      <UserModals
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedUser={selectedUser}
        onClose={handleCloseModals}
        onUserCreated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onUserUpdated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onUserDeleted={() => {
          handleCloseModals();
          triggerRefresh();
        }}
      />
    </div>
  );
}