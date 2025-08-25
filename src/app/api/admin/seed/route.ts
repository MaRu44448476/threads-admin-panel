import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'sample' } = body;

    if (type === 'sample') {
      // Create sample users
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const users = await Promise.all([
        // Admin system user for AI generations
        prisma.user.upsert({
          where: { email: 'admin@system.local' },
          update: {},
          create: {
            id: 'admin-system',
            email: 'admin@system.local',
            name: 'Admin System',
            role: 'admin'
          }
        }),
        prisma.user.upsert({
          where: { email: 'admin@threadbot.com' },
          update: {},
          create: {
            email: 'admin@threadbot.com',
            name: '管理者',
            password: hashedPassword,
            role: 'admin'
          }
        }),
        prisma.user.upsert({
          where: { email: 'user1@example.com' },
          update: {},
          create: {
            email: 'user1@example.com',
            name: '田中太郎',
            password: hashedPassword,
            role: 'user'
          }
        }),
        prisma.user.upsert({
          where: { email: 'user2@example.com' },
          update: {},
          create: {
            email: 'user2@example.com',
            name: '佐藤花子',
            password: hashedPassword,
            role: 'user'
          }
        }),
        prisma.user.upsert({
          where: { email: 'demo@threadbot.com' },
          update: {},
          create: {
            email: 'demo@threadbot.com',
            name: 'デモユーザー',
            password: hashedPassword,
            role: 'user'
          }
        })
      ]);

      // Create sample posts
      const samplePosts = [
        {
          content: '今日は良い天気ですね！散歩日和です。#天気 #散歩',
          status: 'published',
          publishedAt: new Date()
        },
        {
          content: 'AI技術の進歩が素晴らしいです。未来が楽しみ！ #AI #技術',
          status: 'published',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          content: '新しいプロジェクトを開始しました。頑張ります！ #プロジェクト #開発',
          status: 'draft'
        },
        {
          content: '明日の会議の準備をしています。',
          status: 'scheduled',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          content: 'ThreadBotでの投稿生成、とても便利です！ #ThreadBot #AI',
          status: 'published',
          publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
      ];

      for (let i = 0; i < samplePosts.length; i++) {
        const post = samplePosts[i];
        const user = users[i % users.length];
        
        await prisma.post.create({
          data: {
            ...post,
            userId: user.id
          }
        });
      }

      // Create sample AI generations
      const sampleGenerations = [
        {
          prompt: '今日の天気について投稿したい',
          generatedContent: '今日は素晴らしい天気ですね！青空が広がって、散歩にぴったりの一日です。 #天気 #散歩 #青空',
          model: 'gemini-2.0-flash-exp',
          tokensUsed: 85,
          cost: 0.02
        },
        {
          prompt: 'AI技術について書きたい',
          generatedContent: 'AI技術の急速な発展に驚いています。これからの社会がどう変わっていくのか、とても楽しみです！ #AI #技術 #未来',
          model: 'gemini-2.0-flash-exp',
          tokensUsed: 92,
          cost: 0.023
        },
        {
          prompt: '新しいプロジェクトの開始を報告',
          generatedContent: '新しいプロジェクトがスタートしました！チーム一同、全力で取り組んでいきます。応援よろしくお願いします！ #プロジェクト #開発',
          model: 'gemini-2.0-flash-exp',
          tokensUsed: 78,
          cost: 0.018
        }
      ];

      for (let i = 0; i < sampleGenerations.length; i++) {
        const generation = sampleGenerations[i];
        const user = users[i % users.length];
        
        await prisma.aIGeneration.create({
          data: {
            ...generation,
            userId: user.id
          }
        });
      }

      // Create sample schedules
      await prisma.schedule.create({
        data: {
          userId: users[0].id,
          name: '毎日の挨拶投稿',
          time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          frequency: 'daily',
          nextRun: new Date(Date.now() + 60 * 60 * 1000)
        }
      });

      // Create admin logs
      await prisma.adminLog.create({
        data: {
          action: 'サンプルデータ生成',
          details: JSON.stringify({
            users: users.length,
            posts: samplePosts.length,
            generations: sampleGenerations.length,
            timestamp: new Date().toISOString()
          }),
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Admin Panel'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'サンプルデータを生成しました',
        data: {
          users: users.length,
          posts: samplePosts.length,
          generations: sampleGenerations.length,
          schedules: 1
        }
      });
    }

    if (type === 'clear') {
      // Clear all data (be careful!)
      await prisma.adminLog.deleteMany();
      await prisma.systemStats.deleteMany();
      await prisma.schedule.deleteMany();
      await prisma.aIGeneration.deleteMany();
      await prisma.post.deleteMany();
      await prisma.threadsAccount.deleteMany();
      await prisma.user.deleteMany();

      await prisma.adminLog.create({
        data: {
          action: 'データベースクリア',
          details: JSON.stringify({
            action: 'すべてのデータを削除',
            timestamp: new Date().toISOString()
          }),
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Admin Panel'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'すべてのデータを削除しました'
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin Data Seeding API',
    availableTypes: [
      'sample - Create sample data for testing',
      'clear - Clear all data (dangerous!)'
    ],
    version: '1.0.0',
  });
}