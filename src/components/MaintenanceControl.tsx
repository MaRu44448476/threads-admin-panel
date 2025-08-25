'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield,
  AlertTriangle,
  Power,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Wrench
} from 'lucide-react';

interface MaintenanceSettings {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  scheduledMaintenance?: {
    start: string;
    end: string;
    message: string;
  };
  allowedIps: string[];
  emergencyAccess: boolean;
  lastUpdated: string;
}

export default function MaintenanceControl() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    isMaintenanceMode: false,
    maintenanceMessage: 'システムメンテナンス中です。しばらくお待ちください。',
    allowedIps: [],
    emergencyAccess: false,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [scheduledMessage, setScheduledMessage] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/maintenance');
      const data = await response.json();

      if (response.ok) {
        setSettings(data.data);
        setCustomMessage(data.data.maintenanceMessage);
        if (data.data.scheduledMaintenance) {
          setScheduledStart(data.data.scheduledMaintenance.start);
          setScheduledEnd(data.data.scheduledMaintenance.end);
          setScheduledMessage(data.data.scheduledMaintenance.message);
        }
        setError('');
      } else {
        setError(data.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Maintenance settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_maintenance',
          enabled: !settings.isMaintenanceMode,
          message: customMessage || settings.maintenanceMessage
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        await fetchSettings();
      } else {
        alert(`❌ ${result.error || 'メンテナンスモードの切り替えに失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Maintenance toggle error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!scheduledStart || !scheduledEnd) {
      alert('開始時刻と終了時刻を指定してください');
      return;
    }

    if (new Date(scheduledStart) >= new Date(scheduledEnd)) {
      alert('終了時刻は開始時刻より後に設定してください');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'schedule_maintenance',
          start: scheduledStart,
          end: scheduledEnd,
          message: scheduledMessage || 'スケジュールされたメンテナンス'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        await fetchSettings();
      } else {
        alert(`❌ ${result.error || 'メンテナンスのスケジュールに失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Schedule maintenance error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencyAccess = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_emergency_access',
          enabled: !settings.emergencyAccess
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        await fetchSettings();
      } else {
        alert(`❌ ${result.error || '緊急アクセスの切り替えに失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Emergency access toggle error:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 自動更新（30秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSettings();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">メンテナンス設定を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-orange-600" />
              メンテナンスモード制御
            </h1>
            <p className="text-gray-600">システム全体のメンテナンスモードを制御</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* 現在の状態 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold text-gray-900">システム状態</h3>
            </div>
            <div className="flex items-center gap-2">
              {settings.isMaintenanceMode ? (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">メンテナンス中</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">正常稼働中</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">緊急アクセス</h3>
            </div>
            <div className="flex items-center gap-2">
              {settings.emergencyAccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">有効</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">無効</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-purple-500" />
              <h3 className="font-semibold text-gray-900">最終更新</h3>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(settings.lastUpdated).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* メンテナンスモード制御 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Power className="w-6 h-6 text-red-500" />
          即座にメンテナンスモード切り替え
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メンテナンスメッセージ
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="メンテナンス中に表示するメッセージを入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                settings.isMaintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : settings.isMaintenanceMode ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {settings.isMaintenanceMode ? 'メンテナンス終了' : 'メンテナンス開始'}
            </button>

            <button
              onClick={handleEmergencyAccess}
              disabled={saving}
              className={`px-4 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                settings.emergencyAccess
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              {settings.emergencyAccess ? '緊急アクセス無効' : '緊急アクセス有効'}
            </button>
          </div>

          {settings.isMaintenanceMode && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h4 className="text-red-800 font-semibold">メンテナンス中</h4>
                  <p className="text-red-700 text-sm">
                    現在システムはメンテナンスモードです。一般ユーザーはアクセスできません。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* スケジュールされたメンテナンス */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-500" />
          スケジュールされたメンテナンス
        </h2>

        {settings.scheduledMaintenance && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h4 className="text-blue-800 font-semibold">予定されたメンテナンス</h4>
            </div>
            <p className="text-blue-700 text-sm">
              {new Date(settings.scheduledMaintenance.start).toLocaleString('ja-JP')} ～ 
              {new Date(settings.scheduledMaintenance.end).toLocaleString('ja-JP')}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              {settings.scheduledMaintenance.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始時刻
            </label>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              終了時刻
            </label>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            スケジュールメッセージ
          </label>
          <input
            type="text"
            value={scheduledMessage}
            onChange={(e) => setScheduledMessage(e.target.value)}
            placeholder="スケジュールされたメンテナンスのメッセージ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleScheduleMaintenance}
            disabled={saving || !scheduledStart || !scheduledEnd}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            メンテナンススケジュール設定
          </button>
        </div>
      </motion.div>
    </div>
  );
}