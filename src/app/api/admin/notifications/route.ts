import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 通知一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // info, warning, error, success
    const category = searchParams.get('category');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // 条件を構築
    const whereCondition: any = {};
    
    if (type) whereCondition.type = type;
    if (category) whereCondition.category = category;
    if (unreadOnly) whereCondition.isRead = false;
    if (userId) whereCondition.userId = userId;

    // システム全体の通知も含める場合
    if (!userId) {
      whereCondition.OR = [
        { userId: null }, // システム全体通知
        ...(userId ? [{ userId }] : [])
      ];
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.notification.count({ where: whereCondition })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST: 新しい通知を作成
export async function POST(request: NextRequest) {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'normal',
      category,
      userId,
      data,
      expiresAt
    } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        priority,
        category,
        userId,
        data: data ? JSON.stringify(data) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: userId ? {
          select: { id: true, name: true, email: true }
        } : false
      }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'notification_created',
        details: `Notification created: ${title} (${type})`
      }
    });

    console.log(`📢 Notification created: ${title} (${type})`);

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH: 通知を既読にする、または一括操作
export async function PATCH(request: NextRequest) {
  try {
    const { action, notificationId, notificationIds, userId } = await request.json();

    switch (action) {
      case 'mark_read':
        if (notificationId) {
          // 単一通知を既読
          await prisma.notification.update({
            where: { id: notificationId },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });
        } else if (notificationIds?.length > 0) {
          // 複数通知を既読
          await prisma.notification.updateMany({
            where: { id: { in: notificationIds } },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });
        } else {
          return NextResponse.json(
            { error: 'Notification ID(s) required' },
            { status: 400 }
          );
        }
        break;

      case 'mark_all_read':
        // すべての通知を既読（ユーザー指定可能）
        const whereCondition = userId ? { userId } : {};
        await prisma.notification.updateMany({
          where: {
            ...whereCondition,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      case 'delete_read':
        // 既読通知を削除
        const deleteCondition = userId ? { userId, isRead: true } : { isRead: true };
        await prisma.notification.deleteMany({
          where: deleteCondition
        });
        break;

      case 'create_test_alert':
        // テストアラートを作成
        await prisma.notification.create({
          data: {
            title: 'テストアラート',
            message: '管理パネルからのテストアラートです。システムは正常に動作しています。',
            type: 'info',
            priority: 'normal',
            category: 'test',
            metadata: JSON.stringify({
              source: 'admin_panel',
              testType: 'manual',
              timestamp: new Date().toISOString()
            })
          }
        });
        break;

      case 'mark_unread':
        // 通知を未読にする
        if (notificationIds?.length > 0) {
          await prisma.notification.updateMany({
            where: { id: { in: notificationIds } },
            data: {
              isRead: false,
              readAt: null
            }
          });
        }
        break;

      case 'delete':
        // 通知を削除
        if (notificationIds?.length > 0) {
          await prisma.notification.deleteMany({
            where: { id: { in: notificationIds } }
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification action completed'
    });

  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE: 通知を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}