import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: アラートルール一覧を取得
export async function GET() {
  try {
    const alertRules = await prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: alertRules
    });

  } catch (error) {
    console.error('Alert rules fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

// POST: 新しいアラートルールを作成
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    if (action === 'create_rule') {
      const { name, condition, threshold, action: ruleAction, isEnabled } = data;

      if (!name || !condition || !ruleAction) {
        return NextResponse.json(
          { error: 'Required fields are missing' },
          { status: 400 }
        );
      }

      // 新しいルールを作成
      const newRule = await prisma.alertRule.create({
        data: {
          name,
          condition,
          threshold: threshold || 80,
          action: ruleAction,
          isEnabled: isEnabled !== false,
          settings: JSON.stringify({
            createdBy: 'admin',
            autoResolve: true,
            cooldownMinutes: 30
          })
        }
      });

      // ログを記録
      await prisma.adminLog.create({
        data: {
          action: 'alert_rule_created',
          details: JSON.stringify({
            ruleId: newRule.id,
            name: newRule.name,
            condition: newRule.condition
          })
        }
      });

      return NextResponse.json({
        success: true,
        message: 'アラートルールが作成されました',
        data: newRule
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Alert rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}

// PATCH: アラートルールを更新
export async function PATCH(request: NextRequest) {
  try {
    const { ruleId, updates } = await request.json();

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // ルールが存在するかチェック
    const existingRule = await prisma.alertRule.findUnique({
      where: { id: ruleId }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    // ルールを更新
    const updatedRule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    // ログを記録
    await prisma.adminLog.create({
      data: {
        action: 'alert_rule_updated',
        details: JSON.stringify({
          ruleId,
          updates,
          previousState: {
            isEnabled: existingRule.isEnabled
          }
        })
      }
    });

    // 通知を作成
    await prisma.notification.create({
      data: {
        title: 'アラートルール更新',
        message: `アラートルール "${existingRule.name}" が${updates.isEnabled ? '有効化' : '無効化'}されました`,
        type: 'info',
        category: 'system'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'アラートルールが更新されました',
      data: updatedRule
    });

  } catch (error) {
    console.error('Alert rule update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

// DELETE: アラートルールを削除
export async function DELETE(request: NextRequest) {
  try {
    const { ruleId } = await request.json();

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // ルールが存在するかチェック
    const existingRule = await prisma.alertRule.findUnique({
      where: { id: ruleId }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    // ルールを削除
    await prisma.alertRule.delete({
      where: { id: ruleId }
    });

    // ログを記録
    await prisma.adminLog.create({
      data: {
        action: 'alert_rule_deleted',
        details: JSON.stringify({
          ruleId,
          name: existingRule.name,
          condition: existingRule.condition
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'アラートルールが削除されました'
    });

  } catch (error) {
    console.error('Alert rule deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}

// アラートルールの評価と実行
export async function evaluateAlertRules() {
  try {
    const activeRules = await prisma.alertRule.findMany({
      where: { isEnabled: true }
    });

    const now = new Date();
    const results = [];

    for (const rule of activeRules) {
      try {
        // クールダウン期間をチェック
        if (rule.lastTriggered) {
          const timeDiff = now.getTime() - rule.lastTriggered.getTime();
          const cooldownMs = 30 * 60 * 1000; // 30分のクールダウン
          
          if (timeDiff < cooldownMs) {
            continue; // クールダウン中はスキップ
          }
        }

        // 条件を評価
        const shouldTrigger = await evaluateRuleCondition(rule);
        
        if (shouldTrigger) {
          // アクションを実行
          await executeRuleAction(rule);
          
          // 最後のトリガー時間を更新
          await prisma.alertRule.update({
            where: { id: rule.id },
            data: { lastTriggered: now }
          });

          results.push({
            ruleId: rule.id,
            name: rule.name,
            triggered: true
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        results.push({
          ruleId: rule.id,
          name: rule.name,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Alert rule evaluation error:', error);
    throw error;
  }
}

// ルール条件の評価
async function evaluateRuleCondition(rule: any): Promise<boolean> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  switch (rule.condition) {
    case 'api_usage_high':
      const apiCalls = await prisma.adminLog.count({
        where: {
          action: 'api_usage',
          createdAt: { gte: hourAgo }
        }
      });
      const apiLimit = 100; // 設定から取得すべき
      return (apiCalls / apiLimit) * 100 >= rule.threshold;

    case 'token_usage_high':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tokenUsage = await prisma.aIGeneration.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { tokensUsed: true }
      });
      
      const tokenLimit = 50000; // 設定から取得すべき
      const usedTokens = Number(tokenUsage._sum.tokensUsed) || 0;
      return (usedTokens / tokenLimit) * 100 >= rule.threshold;

    case 'error_rate_high':
      const totalLogs = await prisma.adminLog.count({
        where: { createdAt: { gte: hourAgo } }
      });
      
      const errorLogs = await prisma.adminLog.count({
        where: {
          createdAt: { gte: hourAgo },
          action: { contains: 'error' }
        }
      });
      
      if (totalLogs === 0) return false;
      return (errorLogs / totalLogs) * 100 >= rule.threshold;

    default:
      return false;
  }
}

// ルールアクションの実行
async function executeRuleAction(rule: any) {
  switch (rule.action) {
    case 'notification':
      await prisma.notification.create({
        data: {
          title: `アラート: ${rule.name}`,
          message: `条件 "${rule.condition}" が閾値 ${rule.threshold}% を超過しました`,
          type: 'warning',
          priority: 'high',
          category: 'alert',
          metadata: JSON.stringify({
            ruleId: rule.id,
            condition: rule.condition,
            threshold: rule.threshold,
            triggeredAt: new Date().toISOString()
          })
        }
      });
      break;

    case 'email':
      // メール送信の実装
      console.log(`Email alert triggered: ${rule.name}`);
      break;

    case 'webhook':
      // Webhook送信の実装
      console.log(`Webhook alert triggered: ${rule.name}`);
      break;

    case 'auto_scale':
      // 自動スケーリングの実装
      console.log(`Auto scale triggered: ${rule.name}`);
      break;

    default:
      console.log(`Unknown action: ${rule.action}`);
  }
}