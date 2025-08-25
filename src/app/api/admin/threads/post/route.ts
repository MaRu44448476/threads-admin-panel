import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { content, userId = 'admin-system', scheduleFor } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Threads API endpoint (Meta Graph API)
    const THREADS_API_URL = 'https://graph.threads.net/v1.0';
    
    // 実際のThreads APIキーが必要な場合のための環境変数
    const threadsAccessToken = process.env.THREADS_ACCESS_TOKEN;
    
    if (!threadsAccessToken) {
      // デモモード: 実際のAPIキーがない場合はシミュレーション
      console.log('📝 Threads API Demo Mode - Simulating post submission');
      
      // データベースに投稿を保存（デモモード）
      const post = await prisma.post.create({
        data: {
          userId,
          content,
          status: 'published',
          publishedAt: scheduleFor ? new Date(scheduleFor) : new Date(),
          threadsPostId: `demo_${Date.now()}`,
          views: Math.floor(Math.random() * 100),
          engagements: Math.floor(Math.random() * 20)
        }
      });

      // 管理ログに記録
      await prisma.adminLog.create({
        data: {
          action: 'threads_post_demo',
          details: `Demo post created: ${content.substring(0, 50)}...`
        }
      });

      return NextResponse.json({
        success: true,
        mode: 'demo',
        data: {
          id: post.id,
          threadsPostId: post.threadsPostId,
          content: post.content,
          publishedAt: post.publishedAt,
          views: post.views,
          engagements: post.engagements,
          message: 'デモモードで投稿をシミュレーションしました'
        }
      });
    }

    // 実際のThreads API呼び出し
    try {
      // Step 1: Create media container
      const mediaResponse = await fetch(`${THREADS_API_URL}/me/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${threadsAccessToken}`
        },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: content
        })
      });

      const mediaData = await mediaResponse.json();

      if (!mediaResponse.ok) {
        throw new Error(`Threads API Error: ${mediaData.error?.message || 'Unknown error'}`);
      }

      // Step 2: Publish the post
      const publishResponse = await fetch(`${THREADS_API_URL}/me/threads_publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${threadsAccessToken}`
        },
        body: JSON.stringify({
          creation_id: mediaData.id
        })
      });

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(`Threads Publish Error: ${publishData.error?.message || 'Unknown error'}`);
      }

      // データベースに投稿を保存（成功）
      const post = await prisma.post.create({
        data: {
          userId,
          content,
          status: 'published',
          publishedAt: new Date(),
          threadsPostId: publishData.id,
          views: 0,
          engagements: 0
        }
      });

      // 管理ログに記録
      await prisma.adminLog.create({
        data: {
          action: 'threads_post_published',
          details: `Successfully posted to Threads: ${publishData.id}`
        }
      });

      return NextResponse.json({
        success: true,
        mode: 'live',
        data: {
          id: post.id,
          threadsPostId: post.threadsPostId,
          content: post.content,
          publishedAt: post.publishedAt,
          message: 'Threadsに正常に投稿されました'
        }
      });

    } catch (apiError) {
      console.error('Threads API Error:', apiError);
      
      // データベースに失敗した投稿を記録
      const post = await prisma.post.create({
        data: {
          userId,
          content,
          status: 'failed',
          error: apiError instanceof Error ? apiError.message : 'Unknown API error'
        }
      });

      // エラーログを記録
      await prisma.adminLog.create({
        data: {
          action: 'threads_post_failed',
          details: `Failed to post to Threads: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
        }
      });

      return NextResponse.json(
        { 
          error: 'Threads投稿に失敗しました',
          details: apiError instanceof Error ? apiError.message : 'Unknown error',
          postId: post.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Post creation error:', error);
    
    // エラーログを記録
    try {
      await prisma.adminLog.create({
        data: {
          action: 'post_creation_error',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        error: '投稿作成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}