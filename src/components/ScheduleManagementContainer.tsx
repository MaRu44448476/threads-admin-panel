'use client';

import { useState } from 'react';
import ScheduleManagement from './ScheduleManagement';
import ScheduleModals from './ScheduleModals';

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

export default function ScheduleManagementContainer() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedSchedule(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <ScheduleManagement
        key={refreshTrigger} // リフレッシュトリガー
        onScheduleAction={(action, schedule) => {
          switch (action) {
            case 'create':
              setShowCreateModal(true);
              break;
            case 'edit':
              setSelectedSchedule(schedule || null);
              setShowEditModal(true);
              break;
            case 'delete':
              setSelectedSchedule(schedule || null);
              setShowDeleteModal(true);
              break;
            case 'view':
              // 詳細表示の実装（今回は省略）
              console.log('View schedule:', schedule);
              break;
          }
        }}
      />

      <ScheduleModals
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedSchedule={selectedSchedule}
        onClose={handleCloseModals}
        onScheduleCreated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onScheduleUpdated={() => {
          handleCloseModals();
          triggerRefresh();
        }}
        onScheduleDeleted={() => {
          handleCloseModals();
          triggerRefresh();
        }}
      />
    </div>
  );
}