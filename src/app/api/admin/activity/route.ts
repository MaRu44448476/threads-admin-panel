import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get recent admin logs
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        action: true,
        details: true,
        ipAddress: true,
        createdAt: true
      }
    });

    // Get recent user activities
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Get recent AI generations
    const recentGenerations = await prisma.aIGeneration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Combine and format activities
    const activities: Array<{
      id: string;
      type: string;
      action: string;
      details: string;
      timestamp: Date;
      icon: string;
      color: string;
    }> = [];

    // Add user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registration',
        action: 'ユーザー登録',
        details: `${user.email} が新規登録`,
        timestamp: user.createdAt,
        icon: 'user',
        color: 'blue'
      });
    });

    // Add posts
    recentPosts.forEach(post => {
      const action = post.status === 'published' ? '投稿公開' : 
                     post.status === 'scheduled' ? '投稿予約' : 
                     post.status === 'failed' ? '投稿失敗' : '下書き作成';
      
      activities.push({
        id: `post-${post.id}`,
        type: `post_${post.status}`,
        action,
        details: `${post.user.name || post.user.email}: ${post.content.substring(0, 50)}...`,
        timestamp: post.createdAt,
        icon: 'file',
        color: post.status === 'published' ? 'green' : 
               post.status === 'failed' ? 'red' : 'gray'
      });
    });

    // Add AI generations
    recentGenerations.forEach(gen => {
      activities.push({
        id: `gen-${gen.id}`,
        type: 'ai_generation',
        action: 'AI生成',
        details: `${gen.user.name || gen.user.email}: ${gen.prompt.substring(0, 50)}...`,
        timestamp: gen.createdAt,
        icon: 'zap',
        color: 'purple'
      });
    });

    // Add admin logs
    logs.forEach(log => {
      let parsedDetails = '';
      try {
        const details = JSON.parse(log.details || '{}');
        parsedDetails = details.message || log.action;
      } catch {
        parsedDetails = log.details || log.action;
      }

      activities.push({
        id: `log-${log.id}`,
        type: 'admin_action',
        action: log.action,
        details: parsedDetails,
        timestamp: log.createdAt,
        icon: 'shield',
        color: 'red'
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Take only the requested limit
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        activities: limitedActivities,
        pagination: {
          page,
          limit,
          total: activities.length
        }
      }
    });

  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}