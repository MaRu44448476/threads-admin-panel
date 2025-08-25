import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: 個別ユーザー取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
            profileUrl: true,
            isActive: true,
            createdAt: true
          }
        },
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            status: true,
            publishedAt: true,
            views: true,
            engagements: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // パスワードを除外してレスポンス
    const { password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      data: safeUser
    });

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: ユーザー情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email, name, password, role, isActive } = await request.json();

    // ユーザー存在確認
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // メールアドレスの重複チェック（自分以外）
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 更新データを準備
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // パスワード更新の場合はハッシュ化
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // ユーザー更新
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'user_updated',
        details: `User updated: ${updatedUser.email} - Fields: ${Object.keys(updateData).join(', ')}`
      }
    });

    // パスワードを除外してレスポンス
    const { password: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'ユーザー情報が正常に更新されました'
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: ユーザー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ユーザー存在確認
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 管理者の削除を防ぐ（オプション）
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        { error: '管理者ユーザーは削除できません' },
        { status: 400 }
      );
    }

    // ユーザー削除（カスケード削除で関連データも削除される）
    await prisma.user.delete({
      where: { id: params.id }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'user_deleted',
        details: `User deleted: ${existingUser.email}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ユーザーが正常に削除されました'
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}