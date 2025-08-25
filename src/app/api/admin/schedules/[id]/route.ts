import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 個別スケジュール取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'スケジュールが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json(
      { error: 'スケジュール情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: スケジュール情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { 
      name,
      time,
      frequency,
      isActive
    } = await request.json();

    // スケジュール存在確認
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'スケジュールが見つかりません' },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (time) {
      updateData.time = new Date(time);
      // 時間が変更された場合は次回実行日時を再計算
      updateData.nextRun = calculateNextRun(new Date(time), frequency || existingSchedule.frequency);
    }
    if (frequency) {
      updateData.frequency = frequency;
      // 頻度が変更された場合は次回実行日時を再計算
      const scheduleTime = time ? new Date(time) : existingSchedule.time;
      updateData.nextRun = calculateNextRun(scheduleTime, frequency);
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // スケジュール更新
    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'schedule_updated',
        details: `Schedule updated: ${updatedSchedule.name} - Fields: ${Object.keys(updateData).join(', ')}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'スケジュールが正常に更新されました'
    });

  } catch (error) {
    console.error('Schedule update error:', error);
    return NextResponse.json(
      { error: 'スケジュールの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: スケジュール削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // スケジュール存在確認
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      select: { name: true, frequency: true, runCount: true }
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'スケジュールが見つかりません' },
        { status: 404 }
      );
    }

    // スケジュール削除
    await prisma.schedule.delete({
      where: { id: params.id }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'schedule_deleted',
        details: `Schedule deleted: ${existingSchedule.name} (${existingSchedule.frequency}) - Runs: ${existingSchedule.runCount}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'スケジュールが正常に削除されました'
    });

  } catch (error) {
    console.error('Schedule deletion error:', error);
    return NextResponse.json(
      { error: 'スケジュールの削除に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH: スケジュール実行・停止
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'スケジュールが見つかりません' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let actionMessage = '';

    switch (action) {
      case 'activate':
        updateData = {
          isActive: true,
          nextRun: calculateNextRun(existingSchedule.time, existingSchedule.frequency)
        };
        actionMessage = 'スケジュールを有効化しました';
        break;

      case 'deactivate':
        updateData = {
          isActive: false
        };
        actionMessage = 'スケジュールを無効化しました';
        break;

      case 'run_now':
        // 即座に実行（実際の実行ロジックは別途実装）
        updateData = {
          lastRun: new Date(),
          runCount: existingSchedule.runCount + 1,
          nextRun: calculateNextRun(existingSchedule.time, existingSchedule.frequency)
        };
        actionMessage = 'スケジュールを手動実行しました';
        break;

      case 'reset':
        updateData = {
          runCount: 0,
          lastRun: null,
          nextRun: calculateNextRun(existingSchedule.time, existingSchedule.frequency)
        };
        actionMessage = 'スケジュールをリセットしました';
        break;

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: `schedule_${action}`,
        details: `Schedule ${action}: ${updatedSchedule.name}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: actionMessage
    });

  } catch (error) {
    console.error('Schedule action error:', error);
    return NextResponse.json(
      { error: 'スケジュール操作に失敗しました' },
      { status: 500 }
    );
  }
}

// 次回実行日時を計算する関数
function calculateNextRun(baseTime: Date, frequency: string): Date {
  const now = new Date();
  const next = new Date(baseTime);

  switch (frequency) {
    case 'once':
      return next;
    
    case 'daily':
      while (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    
    case 'weekly':
      while (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    
    case 'monthly':
      while (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    
    default:
      return next;
  }
}