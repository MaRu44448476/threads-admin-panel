import { NextRequest, NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';
import { prisma } from '@/lib/prisma';

// GET: スケジューラーの状態取得
export async function GET() {
  try {
    const status = scheduler.getStatus();
    
    // 最近の実行結果を取得
    const recentExecutions = await prisma.adminLog.findMany({
      where: {
        action: {
          in: ['schedule_executed', 'schedule_execution_failed']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 次回実行予定のスケジュールを取得
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        nextRun: {
          gte: new Date()
        }
      },
      orderBy: { nextRun: 'asc' },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        status,
        recentExecutions,
        upcomingSchedules,
        nextExecution: upcomingSchedules[0]?.nextRun || null
      }
    });

  } catch (error) {
    console.error('Scheduler status error:', error);
    return NextResponse.json(
      { error: 'スケジューラー状態の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: スケジュール実行を手動トリガー
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'execute_now':
        console.log('🚀 Manual schedule execution triggered');
        
        // スケジューラーを実行
        const results = await scheduler.executeSchedules();
        
        // 実行結果をログに記録
        await prisma.adminLog.create({
          data: {
            action: 'manual_schedule_execution',
            details: `Manual execution completed. ${results.length} schedules processed. Success: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'スケジュール実行が完了しました',
            results,
            summary: {
              total: results.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length
            }
          }
        });

      case 'check_status':
        const status = scheduler.getStatus();
        return NextResponse.json({
          success: true,
          data: { status }
        });

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Scheduler execution error:', error);
    
    // エラーログを記録
    await prisma.adminLog.create({
      data: {
        action: 'scheduler_error',
        details: `Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    });

    return NextResponse.json(
      { 
        error: 'スケジュール実行に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}