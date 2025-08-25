import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// デフォルト設定
const DEFAULT_SETTINGS = [
  {
    key: 'api_rate_limit',
    value: '100',
    type: 'number',
    description: 'API呼び出し数制限（1時間あたり）',
    category: 'api'
  },
  {
    key: 'max_tokens_per_day',
    value: '50000',
    type: 'number',
    description: 'AI生成1日あたり最大トークン数',
    category: 'api'
  },
  {
    key: 'auto_cleanup_days',
    value: '30',
    type: 'number',
    description: '自動ログクリーンアップ期間（日）',
    category: 'system'
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    type: 'boolean',
    description: 'メンテナンスモード',
    category: 'system'
  },
  {
    key: 'notification_email',
    value: 'admin@example.com',
    type: 'string',
    description: 'アラート通知メールアドレス',
    category: 'notification'
  },
  {
    key: 'email_notifications_enabled',
    value: 'true',
    type: 'boolean',
    description: 'メール通知を有効にする',
    category: 'notification'
  },
  {
    key: 'schedule_check_interval',
    value: '60',
    type: 'number',
    description: 'スケジュールチェック間隔（秒）',
    category: 'system'
  },
  {
    key: 'max_concurrent_schedules',
    value: '5',
    type: 'number',
    description: '同時実行可能スケジュール数',
    category: 'system'
  },
  {
    key: 'enable_analytics_tracking',
    value: 'true',
    type: 'boolean',
    description: '分析データの追跡を有効にする',
    category: 'analytics'
  },
  {
    key: 'data_retention_days',
    value: '365',
    type: 'number',
    description: 'データ保持期間（日）',
    category: 'system'
  }
];

// GET: システム設定を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    // 特定のキーを取得
    if (key) {
      const setting = await prisma.systemSettings.findUnique({
        where: { key }
      });

      if (!setting) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: setting
      });
    }

    // 条件に応じて設定を取得
    const whereCondition = category ? { category } : {};

    const settings = await prisma.systemSettings.findMany({
      where: whereCondition,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // カテゴリ別にグループ化
    const groupedSettings: { [key: string]: any[] } = {};
    settings.forEach(setting => {
      const cat = setting.category || 'other';
      if (!groupedSettings[cat]) {
        groupedSettings[cat] = [];
      }
      groupedSettings[cat].push(setting);
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        grouped: groupedSettings
      }
    });

  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST: 新しい設定を作成または初期化
export async function POST(request: NextRequest) {
  try {
    const { action, ...settingData } = await request.json();

    if (action === 'initialize_defaults') {
      // デフォルト設定を初期化
      const results = [];
      
      for (const defaultSetting of DEFAULT_SETTINGS) {
        const existing = await prisma.systemSettings.findUnique({
          where: { key: defaultSetting.key }
        });

        if (!existing) {
          const created = await prisma.systemSettings.create({
            data: defaultSetting
          });
          results.push(created);
        }
      }

      await prisma.adminLog.create({
        data: {
          action: 'system_settings_initialized',
          details: `Initialized ${results.length} default settings`
        }
      });

      return NextResponse.json({
        success: true,
        message: `Initialized ${results.length} default settings`,
        data: results
      });
    }

    // 新しい設定を作成
    const { key, value, type, description, category } = settingData;

    if (!key || !value || !type) {
      return NextResponse.json(
        { error: 'Key, value, and type are required' },
        { status: 400 }
      );
    }

    const setting = await prisma.systemSettings.create({
      data: {
        key,
        value,
        type,
        description,
        category
      }
    });

    await prisma.adminLog.create({
      data: {
        action: 'system_setting_created',
        details: `Setting created: ${key} = ${value}`
      }
    });

    return NextResponse.json({
      success: true,
      data: setting
    });

  } catch (error) {
    console.error('Failed to create setting:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}

// PATCH: 設定を更新
export async function PATCH(request: NextRequest) {
  try {
    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key }
    });

    if (!existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    if (!existingSetting.isEditable) {
      return NextResponse.json(
        { error: 'This setting is not editable' },
        { status: 403 }
      );
    }

    // 型に応じて値を検証
    let validatedValue = value;
    switch (existingSetting.type) {
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return NextResponse.json(
            { error: 'Invalid number value' },
            { status: 400 }
          );
        }
        validatedValue = numValue.toString();
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return NextResponse.json(
            { error: 'Invalid boolean value' },
            { status: 400 }
          );
        }
        validatedValue = Boolean(value === true || value === 'true').toString();
        break;
      
      case 'json':
        try {
          JSON.parse(value);
        } catch {
          return NextResponse.json(
            { error: 'Invalid JSON value' },
            { status: 400 }
          );
        }
        break;
    }

    const updatedSetting = await prisma.systemSettings.update({
      where: { key },
      data: {
        value: validatedValue,
        ...(description && { description })
      }
    });

    await prisma.adminLog.create({
      data: {
        action: 'system_setting_updated',
        details: `Setting updated: ${key} = ${validatedValue}`
      }
    });

    console.log(`⚙️ Setting updated: ${key} = ${validatedValue}`);

    return NextResponse.json({
      success: true,
      data: updatedSetting
    });

  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// DELETE: 設定を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const setting = await prisma.systemSettings.findUnique({
      where: { key }
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    if (!setting.isEditable) {
      return NextResponse.json(
        { error: 'This setting cannot be deleted' },
        { status: 403 }
      );
    }

    await prisma.systemSettings.delete({
      where: { key }
    });

    await prisma.adminLog.create({
      data: {
        action: 'system_setting_deleted',
        details: `Setting deleted: ${key}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Setting deleted'
    });

  } catch (error) {
    console.error('Failed to delete setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}