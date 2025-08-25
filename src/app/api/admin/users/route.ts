import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // フィルター条件を構築
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.isActive = status === 'active';
    }

    // ユーザー取得とカウント
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              posts: true,
              generations: true,
              schedules: true
            }
          },
          threadsAccount: {
            select: {
              username: true,
              isActive: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // パスワードを除外してレスポンス
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規ユーザー作成
export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'user', isActive = true } = await request.json();

    // バリデーション
    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと名前は必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        isActive
      },
      include: {
        _count: {
          select: {
            posts: true,
            generations: true,
            schedules: true
          }
        }
      }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'user_created',
        details: `New user created: ${email} (${role})`
      }
    });

    // パスワードを除外してレスポンス
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'ユーザーが正常に作成されました'
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
}