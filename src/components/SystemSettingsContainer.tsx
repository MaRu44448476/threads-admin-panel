'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Save,
  RotateCcw,
  Bell,
  Shield,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  category?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GroupedSettings {
  [category: string]: SystemSetting[];
}

export default function SystemSettingsContainer() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categoryIcons: { [key: string]: any } = {
    api: <Zap className="w-5 h-5" />,
    system: <Settings className="w-5 h-5" />,
    notification: <Bell className="w-5 h-5" />,
    analytics: <BarChart3 className="w-5 h-5" />,
    security: <Shield className="w-5 h-5" />,
    other: <AlertCircle className="w-5 h-5" />
  };

  const categoryNames: { [key: string]: string } = {
    api: 'API設定',
    system: 'システム設定',
    notification: '通知設定',
    analytics: '分析設定',
    security: 'セキュリティ設定',
    other: 'その他'
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (response.ok) {
        setSettings(data.data.settings);
        setGroupedSettings(data.data.grouped);
        setError('');
      } else {
        setError(data.error || '設定の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      setSaving({ _init: true });
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initialize_defaults' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('デフォルト設定を初期化しました');
        await fetchSettings();
      } else {
        setError(data.error || '初期化に失敗しました');
      }
    } catch (err) {
      setError('初期化中にエラーが発生しました');
      console.error('Settings initialization error:', err);
    } finally {
      setSaving({ _init: false });
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving({ ...saving, [key]: true });
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`設定「${key}」を更新しました`);
        await fetchSettings();
        setEditingKey(null);
        setEditValue('');
      } else {
        setError(data.error || '設定の更新に失敗しました');
      }
    } catch (err) {
      setError('更新中にエラーが発生しました');
      console.error('Settings update error:', err);
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  const startEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (editingKey) {
      await updateSetting(editingKey, editValue);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const renderSettingInput = (setting: SystemSetting) => {
    const isEditing = editingKey === setting.key;
    const currentValue = isEditing ? editValue : setting.value;

    if (setting.type === 'boolean') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentValue === 'true'}
            onChange={(e) => {
              if (isEditing) {
                setEditValue(e.target.checked.toString());
              } else {
                updateSetting(setting.key, e.target.checked.toString());
              }
            }}
            disabled={!setting.isEditable || (!isEditing && saving[setting.key])}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {currentValue === 'true' ? '有効' : '無効'}
          </span>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type={setting.type === 'number' ? 'number' : 'text'}
            value={currentValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                saveEdit();
              } else if (e.key === 'Escape') {
                cancelEdit();
              }
            }}
          />
          <button
            onClick={saveEdit}
            disabled={saving[setting.key]}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-gray-900 font-medium">
          {setting.type === 'number' ? Number(currentValue).toLocaleString() : currentValue}
        </span>
        {setting.isEditable && setting.type !== 'boolean' && (
          <button
            onClick={() => startEdit(setting)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">設定を読み込み中...</span>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              システム設定
            </h1>
            <p className="text-gray-600">ThreadBotの動作を制御する各種設定</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={initializeDefaults}
              disabled={saving._init}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              デフォルト初期化
            </motion.button>
          </div>
        </div>

        {/* 成功・エラーメッセージ */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{success}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}
      </motion.div>

      {/* 設定カテゴリ */}
      {Object.entries(groupedSettings).map(([category, categorySettings], index) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            {categoryIcons[category] || categoryIcons.other}
            {categoryNames[category] || category}
          </h3>

          <div className="space-y-4">
            {categorySettings.map((setting) => (
              <div key={setting.key} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      {!setting.isEditable && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          読み取り専用
                        </span>
                      )}
                    </div>
                    
                    {setting.description && (
                      <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        タイプ: {setting.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        更新日: {new Date(setting.updatedAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 min-w-0 flex-shrink-0" style={{ minWidth: '200px' }}>
                    {renderSettingInput(setting)}
                  </div>
                </div>

                {saving[setting.key] && (
                  <div className="mt-2 flex items-center gap-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">保存中...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* 空の状態 */}
      {settings.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">設定がありません</h3>
          <p className="text-gray-600 mb-4">
            デフォルト設定を初期化してください
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={initializeDefaults}
            disabled={saving._init}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            デフォルト設定を初期化
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}