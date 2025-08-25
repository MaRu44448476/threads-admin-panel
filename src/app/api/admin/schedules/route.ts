import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: スケジュール一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const frequency = searchParams.get('frequency') || '';
    const isActive = searchParams.get('isActive');
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;

    // フィルター条件を構築
    const where: any = {};
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    
    if (frequency) {
      where.frequency = frequency;
    }
    
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    
    if (userId) {
      where.userId = userId;
    }

    // スケジュール取得とカウント
    const [schedules, totalCount] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.schedule.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        schedules,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Schedules fetch error:', error);
    return NextResponse.json(
      { error: 'スケジュール一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規スケジュール作成
export async function POST(request: NextRequest) {
  try {
    const { 
      name,
      time,
      frequency,
      userId = 'admin-system',
      isActive = true,
      postContent = ''
    } = await request.json();

    // バリデーション
    if (!name || !time || !frequency) {
      return NextResponse.json(
        { error: '名前、時間、頻度は必須です' },
        { status: 400 }
      );
    }

    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 400 }
      );
    }

    // 次回実行日時を計算
    const scheduleTime = new Date(time);
    const nextRun = calculateNextRun(scheduleTime, frequency);

    // スケジュール作成
    const schedule = await prisma.schedule.create({
      data: {
        userId,
        name,
        time: scheduleTime,
        frequency,
        isActive,
        nextRun,
        runCount: 0
      },
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
        action: 'schedule_created',
        details: `New schedule created: ${name} (${frequency}) - Next run: ${nextRun.toISOString()}`
      }
    });

    return NextResponse.json({
      success: true,
      data: schedule,
      message: 'スケジュールが正常に作成されました'
    });

  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'スケジュールの作成に失敗しました' },
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
      // 今日の時刻が過ぎていれば明日
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    
    case 'weekly':
      // 今週の曜日・時刻が過ぎていれば来週
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    
    case 'monthly':
      // 今月の日・時刻が過ぎていれば来月
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    
    default:
      return next;
  }
}