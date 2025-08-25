import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;

    // フィルター条件を構築
    const where: any = {};
    
    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    // 投稿取得とカウント
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
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
      prisma.post.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Posts fetch error:', error);
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規投稿作成
export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      userId = 'admin-system', 
      scheduledFor,
      publishNow = false 
    } = await request.json();

    // バリデーション
    if (!content) {
      return NextResponse.json(
        { error: '投稿内容は必須です' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: '投稿内容は500文字以内で入力してください' },
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

    // 投稿データを準備
    const postData: any = {
      userId,
      content,
      status: publishNow ? 'published' : (scheduledFor ? 'scheduled' : 'draft')
    };

    if (scheduledFor) {
      postData.scheduledFor = new Date(scheduledFor);
    }

    if (publishNow) {
      postData.publishedAt = new Date();
    }

    // 投稿作成
    const post = await prisma.post.create({
      data: postData,
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
        action: 'post_created',
        details: `New post created: ${content.substring(0, 50)}... (${post.status})`
      }
    });

    return NextResponse.json({
      success: true,
      data: post,
      message: '投稿が正常に作成されました'
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}