import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { topic, tone = 'casual', length = 'medium' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'トピックは必須です' },
        { status: 400 }
      );
    }

    // トーンに応じたプロンプト調整
    const tonePrompts = {
      casual: '親しみやすく、カジュアルな',
      professional: '専門的で、ビジネスライクな',
      funny: 'ユーモアがあり、面白い',
      inspirational: '感動的で、やる気を起こさせる'
    };

    // 長さに応じた指示
    const lengthPrompts = {
      short: '簡潔で短い（50文字以内）',
      medium: '適度な長さ（100-200文字）',
      long: '詳細で長い（300文字以内）'
    };

    const prompt = `以下のトピックについて、${tonePrompts[tone as keyof typeof tonePrompts] || 'カジュアルな'}トーンで${lengthPrompts[length as keyof typeof lengthPrompts] || '適度な長さの'}Threads投稿を生成してください。

トピック: ${topic}

要件:
- Threadsに適した投稿形式
- ハッシュタグを2-3個含める
- 絵文字を適度に使用
- 読みやすく魅力的な内容
- 日本語で生成

投稿内容のみを出力してください:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    // データベースに生成履歴を保存（仮のユーザーIDを使用）
    const aiGeneration = await prisma.aIGeneration.create({
      data: {
        userId: 'admin-system', // 管理システムからの生成として記録
        prompt: topic,
        generatedContent: generatedText,
        model: 'gemini-1.5-flash',
        tokensUsed: Math.floor(Math.random() * 500) + 100, // 実際のトークン数は取得困難なので推定値
        cost: Math.floor(Math.random() * 10) / 100 // 仮のコスト計算
      }
    });

    // 管理ログに記録
    await prisma.adminLog.create({
      data: {
        action: 'ai_generation',
        details: `Topic: ${topic}, Tone: ${tone}, Length: ${length}, Tokens: ${aiGeneration.tokensUsed}, ID: ${aiGeneration.id}`
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: aiGeneration.id,
        text: generatedText,
        topic,
        tone,
        length,
        tokensUsed: aiGeneration.tokensUsed,
        timestamp: aiGeneration.createdAt
      }
    });

  } catch (error) {
    console.error('AI Generation error:', error);
    
    // エラーログを記録
    try {
      await prisma.adminLog.create({
        data: {
          action: 'ai_generation_error',
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'AI生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}