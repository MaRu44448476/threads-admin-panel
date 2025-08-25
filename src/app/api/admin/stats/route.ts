import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get overall statistics
    const [
      totalUsers,
      totalPosts,
      totalGenerations,
      recentUsers,
      recentPosts,
      activeSchedules
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.post.count(),
      prisma.aIGeneration.count(),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent posts (last 24 hours)
      prisma.post.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Active schedules
      prisma.schedule.count({
        where: {
          isActive: true
        }
      })
    ]);

    // Calculate additional metrics
    const totalTokensUsed = await prisma.aIGeneration.aggregate({
      _sum: {
        tokensUsed: true
      }
    });

    const totalCost = await prisma.aIGeneration.aggregate({
      _sum: {
        cost: true
      }
    });

    // Get success rate from published vs failed posts
    const [publishedCount, failedCount] = await Promise.all([
      prisma.post.count({
        where: { status: 'published' }
      }),
      prisma.post.count({
        where: { status: 'failed' }
      })
    ]);

    const totalAttempts = publishedCount + failedCount;
    const successRate = totalAttempts > 0 
      ? ((publishedCount / totalAttempts) * 100).toFixed(1)
      : '100.0';

    // Get active sessions (users active in last 30 minutes)
    const activeSessions = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });

    const stats = {
      totalUsers,
      totalPosts,
      totalGenerations,
      totalTokensUsed: totalTokensUsed._sum.tokensUsed || 0,
      activeSessions,
      todayRevenue: totalCost._sum.cost || 0,
      successRate: parseFloat(successRate),
      recentUsers,
      recentPosts,
      activeSchedules,
      growth: {
        users: recentUsers > 0 ? '+' + ((recentUsers / Math.max(totalUsers, 1)) * 100).toFixed(1) + '%' : '0%',
        posts: recentPosts > 0 ? '+' + ((recentPosts / Math.max(totalPosts, 1)) * 100).toFixed(1) + '%' : '0%'
      }
    };

    // Update or create today's system stats
    await prisma.systemStats.upsert({
      where: {
        date: new Date(new Date().setHours(12, 0, 0, 0))
      },
      update: {
        totalUsers,
        totalPosts,
        totalGenerations,
        totalTokensUsed: totalTokensUsed._sum.tokensUsed || 0
      },
      create: {
        totalUsers,
        totalPosts,
        totalGenerations,
        totalTokensUsed: totalTokensUsed._sum.tokensUsed || 0,
        date: new Date(new Date().setHours(12, 0, 0, 0))
      }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, details } = body;

    // Log admin action
    await prisma.adminLog.create({
      data: {
        action,
        details: JSON.stringify(details),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Action logged'
    });

  } catch (error) {
    console.error('Admin log error:', error);
    return NextResponse.json(
      { error: 'Failed to log action' },
      { status: 500 }
    );
  }
}