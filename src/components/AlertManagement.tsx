'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Plus,
  Settings,
  Filter,
  Search
} from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  isRead: boolean;
  isActive: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  action: string;
  isEnabled: boolean;
  lastTriggered?: string;
}

export default function AlertManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'settings'>('alerts');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  // 新しいアラートルール作成用
  const [newRule, setNewRule] = useState({
    name: '',
    condition: 'api_usage_high',
    threshold: 80,
    action: 'notification',
    isEnabled: true
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications?limit=50');
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.data.notifications || []);
        setError('');
      } else {
        setError(data.error || 'アラートの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const response = await fetch('/api/admin/alert-rules');
      const data = await response.json();

      if (response.ok) {
        setAlertRules(data.data || []);
      } else {
        console.error('Failed to fetch alert rules:', data.error);
      }
    } catch (err) {
      console.error('Alert rules fetch error:', err);
    }
  };

  const handleAlertAction = async (action: string, alertIds: string[] = []) => {
    try {
      const targetIds = alertIds.length > 0 ? alertIds : selectedAlerts;
      
      if (targetIds.length === 0 && action !== 'create_test_alert' && action !== 'create_rule') {
        alert('アクションを実行するアラートを選択してください');
        return;
      }

      let response;
      if (action === 'create_rule') {
        response = await fetch('/api/admin/alert-rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            ...newRule
          }),
        });
      } else {
        response = await fetch('/api/admin/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            notificationIds: targetIds
          }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        setSelectedAlerts([]);
        
        if (action === 'create_rule') {
          setNewRule({
            name: '',
            condition: 'api_usage_high',
            threshold: 80,
            action: 'notification',
            isEnabled: true
          });
          await fetchAlertRules();
        } else {
          await fetchAlerts();
        }
      } else {
        alert(`❌ ${result.error || 'アクションが失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Alert action error:', err);
    }
  };

  const handleRuleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/alert-rules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleId,
          updates: { isEnabled: enabled }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        await fetchAlertRules();
      } else {
        alert(`❌ ${result.error || 'ルールの更新に失敗しました'}`);
      }
    } catch (err) {
      alert('❌ エラーが発生しました');
      console.error('Rule toggle error:', err);
    }
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    fetchAlerts();
    fetchAlertRules();
  }, []);

  // 自動更新（60秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'alerts') {
        fetchAlerts();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeTab]);

  if (loading && alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">アラート情報を読み込み中...</span>
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
              <Bell className="w-8 h-8 text-yellow-600" />
              アラート・通知管理
            </h1>
            <p className="text-gray-600">システムアラートと通知ルールの管理</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>

            <button
              onClick={() => handleAlertAction('create_test_alert')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              テストアラート
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { id: 'alerts', name: 'アラート一覧', icon: <Bell className="w-4 h-4" /> },
            { id: 'rules', name: 'ルール設定', icon: <Settings className="w-4 h-4" /> },
            { id: 'settings', name: '通知設定', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}
      </motion.div>

      {/* アラート一覧 */}
      {activeTab === 'alerts' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          {/* フィルターと検索 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="error">エラー</option>
                <option value="warning">警告</option>
                <option value="info">情報</option>
                <option value="success">成功</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="アラートを検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {selectedAlerts.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAlertAction('mark_read')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  既読
                </button>
                <button
                  onClick={() => handleAlertAction('delete')}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
            )}
          </div>

          {/* アラートリスト */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">表示するアラートがありません</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                    alert.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-300 shadow-sm'
                  } ${selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => handleSelectAlert(alert.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />

                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAlertAction(alert.isRead ? 'mark_unread' : 'mark_read', [alert.id])}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title={alert.isRead ? '未読にする' : '既読にする'}
                    >
                      {alert.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleAlertAction('delete', [alert.id])}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ルール設定 */}
      {activeTab === 'rules' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 新しいルール作成 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">新しいアラートルール</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ルール名
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: API使用量警告"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  条件
                </label>
                <select
                  value={newRule.condition}
                  onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="api_usage_high">API使用量が高い</option>
                  <option value="token_usage_high">トークン使用量が高い</option>
                  <option value="error_rate_high">エラー率が高い</option>
                  <option value="system_down">システムダウン</option>
                  <option value="disk_space_low">ディスク容量不足</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  閾値 (%)
                </label>
                <input
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アクション
                </label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="notification">通知作成</option>
                  <option value="email">メール送信</option>
                  <option value="webhook">Webhook送信</option>
                  <option value="auto_scale">自動スケール</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRule.isEnabled}
                  onChange={(e) => setNewRule(prev => ({ ...prev, isEnabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">ルールを有効にする</span>
              </label>

              <button
                onClick={() => handleAlertAction('create_rule')}
                disabled={!newRule.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                ルール作成
              </button>
            </div>
          </div>

          {/* 既存ルール一覧 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">既存のアラートルール</h2>
            
            <div className="space-y-3">
              {alertRules.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">設定されたルールがありません</p>
                </div>
              ) : (
                alertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900">{rule.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.isEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isEnabled ? '有効' : '無効'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rule.condition} ≥ {rule.threshold}% → {rule.action}
                      </p>
                      {rule.lastTriggered && (
                        <p className="text-xs text-gray-400">
                          最後のトリガー: {new Date(rule.lastTriggered).toLocaleString('ja-JP')}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRuleToggle(rule.id, !rule.isEnabled)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        rule.isEnabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {rule.isEnabled ? '無効化' : '有効化'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}