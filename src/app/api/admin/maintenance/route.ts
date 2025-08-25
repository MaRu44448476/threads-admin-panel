import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: メンテナンス設定を取得
export async function GET() {
  try {
    // メンテナンス関連の設定をすべて取得
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'maintenance_mode',
            'maintenance_message', 
            'scheduled_maintenance',
            'emergency_access',
            'allowed_ips'
          ]
        }
      }
    });

    const settingsMap: { [key: string]: string } = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // スケジュールされたメンテナンス情報を解析
    let scheduledMaintenance = null;
    if (settingsMap.scheduled_maintenance) {
      try {
        scheduledMaintenance = JSON.parse(settingsMap.scheduled_maintenance);
      } catch (e) {
        console.error('Failed to parse scheduled maintenance:', e);
      }
    }

    const maintenanceSettings = {
      isMaintenanceMode: settingsMap.maintenance_mode === 'true',
      maintenanceMessage: settingsMap.maintenance_message || 'システムメンテナンス中です。しばらくお待ちください。',
      scheduledMaintenance,
      allowedIps: settingsMap.allowed_ips ? JSON.parse(settingsMap.allowed_ips) : [],
      emergencyAccess: settingsMap.emergency_access === 'true',
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: maintenanceSettings
    });

  } catch (error) {
    console.error('Maintenance settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance settings' },
      { status: 500 }
    );
  }
}

// POST: メンテナンス設定を更新
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'toggle_maintenance':
        await toggleMaintenanceMode(data.enabled, data.message);
        break;

      case 'schedule_maintenance':
        await scheduleMaintenanceMode(data.start, data.end, data.message);
        break;

      case 'toggle_emergency_access':
        await toggleEmergencyAccess(data.enabled);
        break;

      case 'update_allowed_ips':
        await updateAllowedIps(data.ips);
        break;

      case 'check_status':
        const status = await getMaintenanceStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // ログを記録
    await prisma.adminLog.create({
      data: {
        action: `maintenance_${action}`,
        details: JSON.stringify({ action, ...data })
      }
    });

    // 通知を作成
    const actionMessages: { [key: string]: string } = {
      'toggle_maintenance': data.enabled ? 'メンテナンスモードが開始されました' : 'メンテナンスモードが終了されました',
      'schedule_maintenance': 'メンテナンスがスケジュールされました',
      'toggle_emergency_access': data.enabled ? '緊急アクセスが有効化されました' : '緊急アクセスが無効化されました',
      'update_allowed_ips': '許可IPアドレスが更新されました'
    };

    await prisma.notification.create({
      data: {
        title: 'メンテナンス設定変更',
        message: actionMessages[action] || 'メンテナンス設定が変更されました',
        type: action === 'toggle_maintenance' && data.enabled ? 'warning' : 'info',
        priority: action === 'toggle_maintenance' ? 'urgent' : 'normal',
        category: 'system'
      }
    });

    return NextResponse.json({
      success: true,
      message: actionMessages[action] || 'メンテナンス設定が更新されました'
    });

  } catch (error) {
    console.error('Maintenance action error:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance settings' },
      { status: 500 }
    );
  }
}

// メンテナンスモードの切り替え
async function toggleMaintenanceMode(enabled: boolean, message?: string) {
  await prisma.systemSettings.upsert({
    where: { key: 'maintenance_mode' },
    update: { value: enabled.toString() },
    create: {
      key: 'maintenance_mode',
      value: enabled.toString(),
      type: 'boolean',
      description: 'システム全体のメンテナンスモード状態'
    }
  });

  if (message) {
    await prisma.systemSettings.upsert({
      where: { key: 'maintenance_message' },
      update: { value: message },
      create: {
        key: 'maintenance_message',
        value: message,
        type: 'text',
        description: 'メンテナンス中に表示するメッセージ'
      }
    });
  }
}

// スケジュールされたメンテナンス設定
async function scheduleMaintenanceMode(start: string, end: string, message?: string) {
  const scheduleData = {
    start,
    end,
    message: message || 'スケジュールされたメンテナンス',
    scheduledAt: new Date().toISOString()
  };

  await prisma.systemSettings.upsert({
    where: { key: 'scheduled_maintenance' },
    update: { value: JSON.stringify(scheduleData) },
    create: {
      key: 'scheduled_maintenance',
      value: JSON.stringify(scheduleData),
      type: 'json',
      description: 'スケジュールされたメンテナンス情報'
    }
  });

  // スケジュール実行用のワーカーはここで設定可能
  // 実際の環境では cron job や scheduler を使用
}

// 緊急アクセスの切り替え
async function toggleEmergencyAccess(enabled: boolean) {
  await prisma.systemSettings.upsert({
    where: { key: 'emergency_access' },
    update: { value: enabled.toString() },
    create: {
      key: 'emergency_access',
      value: enabled.toString(),
      type: 'boolean',
      description: 'メンテナンス中の緊急管理者アクセス許可'
    }
  });
}

// 許可IPアドレス更新
async function updateAllowedIps(ips: string[]) {
  await prisma.systemSettings.upsert({
    where: { key: 'allowed_ips' },
    update: { value: JSON.stringify(ips) },
    create: {
      key: 'allowed_ips',
      value: JSON.stringify(ips),
      type: 'json',
      description: 'メンテナンス中にアクセスを許可するIPアドレス一覧'
    }
  });
}

// メンテナンス状態確認
async function getMaintenanceStatus() {
  const maintenanceSetting = await prisma.systemSettings.findUnique({
    where: { key: 'maintenance_mode' }
  });

  const emergencyAccessSetting = await prisma.systemSettings.findUnique({
    where: { key: 'emergency_access' }
  });

  // スケジュールされたメンテナンスをチェック
  const scheduledSetting = await prisma.systemSettings.findUnique({
    where: { key: 'scheduled_maintenance' }
  });

  let isScheduledMaintenance = false;
  if (scheduledSetting?.value) {
    try {
      const scheduleData = JSON.parse(scheduledSetting.value);
      const now = new Date();
      const start = new Date(scheduleData.start);
      const end = new Date(scheduleData.end);
      
      isScheduledMaintenance = now >= start && now <= end;
    } catch (e) {
      console.error('Failed to parse scheduled maintenance:', e);
    }
  }

  return {
    isMaintenanceMode: maintenanceSetting?.value === 'true',
    emergencyAccess: emergencyAccessSetting?.value === 'true',
    isScheduledMaintenance,
    effectiveMaintenance: maintenanceSetting?.value === 'true' || isScheduledMaintenance
  };
}

// システム全体で使用する関数（ミドルウェア用）
export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
  emergencyAccess: boolean;
  message?: string;
}> {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_message', 'emergency_access', 'scheduled_maintenance']
        }
      }
    });

    const settingsMap: { [key: string]: string } = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    let isMaintenanceMode = settingsMap.maintenance_mode === 'true';
    
    // スケジュールされたメンテナンスもチェック
    if (!isMaintenanceMode && settingsMap.scheduled_maintenance) {
      try {
        const scheduleData = JSON.parse(settingsMap.scheduled_maintenance);
        const now = new Date();
        const start = new Date(scheduleData.start);
        const end = new Date(scheduleData.end);
        
        isMaintenanceMode = now >= start && now <= end;
      } catch (e) {
        console.error('Failed to parse scheduled maintenance:', e);
      }
    }

    return {
      isMaintenanceMode,
      emergencyAccess: settingsMap.emergency_access === 'true',
      message: settingsMap.maintenance_message || 'システムメンテナンス中です。しばらくお待ちください。'
    };
  } catch (error) {
    console.error('Failed to check maintenance mode:', error);
    return {
      isMaintenanceMode: false,
      emergencyAccess: false
    };
  }
}