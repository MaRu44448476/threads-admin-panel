import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 個別投稿取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
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

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Post fetch error:', error);
    return NextResponse.json(
      { error: '投稿情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: 投稿情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { 
      content, 
      status, 
      scheduledFor,
      publishNow = false 
    } = await request.json();

    // 投稿存在確認
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // バリデーション
    if (content && content.length > 500) {
      return NextResponse.json(
        { error: '投稿内容は500文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 更新データを準備
    const updateData: any = {};
    
    if (content) updateData.content = content;
    if (status) updateData.status = status;
    
    if (scheduledFor) {
      updateData.scheduledFor = new Date(scheduledFor);
      if (!status) updateData.status = 'scheduled';
    }
    
    if (publishNow) {
      updateData.status = 'published';
      updateData.publishedAt = new Date();
      updateData.scheduledFor = null;
    }

    // 投稿更新
    const updatedPost = await prisma.post.update({
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
        action: 'post_updated',
        details: `Post updated: ${updatedPost.content.substring(0, 50)}... - Fields: ${Object.keys(updateData).join(', ')}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: '投稿が正常に更新されました'
    });

  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: 投稿削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 投稿存在確認
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      select: { content: true, status: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿削除
    await prisma.post.delete({
      where: { id: params.id }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'post_deleted',
        details: `Post deleted: ${existingPost.content.substring(0, 50)}... (${existingPost.status})`
      }
    });

    return NextResponse.json({
      success: true,
      message: '投稿が正常に削除されました'
    });

  } catch (error) {
    console.error('Post deletion error:', error);
    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH: 投稿ステータス変更（公開・非公開切り替え）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let actionMessage = '';

    switch (action) {
      case 'publish':
        updateData = {
          status: 'published',
          publishedAt: new Date(),
          scheduledFor: null
        };
        actionMessage = '投稿を公開しました';
        break;

      case 'unpublish':
        updateData = {
          status: 'draft',
          publishedAt: null
        };
        actionMessage = '投稿を非公開にしました';
        break;

      case 'schedule':
        const { scheduledFor } = await request.json();
        if (!scheduledFor) {
          return NextResponse.json(
            { error: 'スケジュール日時が必要です' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'scheduled',
          scheduledFor: new Date(scheduledFor),
          publishedAt: null
        };
        actionMessage = '投稿をスケジュールしました';
        break;

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }

    const updatedPost = await prisma.post.update({
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
        action: `post_${action}`,
        details: `Post ${action}: ${updatedPost.content.substring(0, 50)}...`
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: actionMessage
    });

  } catch (error) {
    console.error('Post status update error:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}