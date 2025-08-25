import { NextRequest, NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';
import { prisma } from '@/lib/prisma';

// Cron job endpoint for automated schedule execution
export async function POST(request: NextRequest) {
  try {
    // Basic security check - verify the request is from authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job attempt:', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting automated cron job execution...');
    
    // Check if scheduler is already running to prevent concurrent execution
    const schedulerStatus = scheduler.getStatus();
    if (schedulerStatus.isRunning) {
      console.log('⏸️ Scheduler already running, skipping execution');
      return NextResponse.json({
        success: true,
        message: 'Scheduler already running',
        skipped: true
      });
    }

    // Execute schedules
    const results = await scheduler.executeSchedules();
    
    // Log the cron execution
    await prisma.adminLog.create({
      data: {
        action: 'automated_cron_execution',
        details: `Automated cron execution completed. ${results.length} schedules processed. Success: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`
      }
    });

    console.log('✅ Cron job execution completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Automated execution completed',
      timestamp: new Date().toISOString(),
      results: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results.map(r => ({
          scheduleId: r.scheduleId,
          success: r.success,
          message: r.message
        }))
      }
    });

  } catch (error) {
    console.error('❌ Cron job execution error:', error);
    
    // Log the error
    await prisma.adminLog.create({
      data: {
        action: 'cron_execution_error',
        details: `Automated cron execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    });

    return NextResponse.json(
      { 
        error: 'Cron execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for cron health check
export async function GET() {
  try {
    const status = scheduler.getStatus();
    const upcomingSchedules = await prisma.schedule.count({
      where: {
        isActive: true,
        nextRun: {
          gte: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      status: 'healthy',
      schedulerRunning: status.isRunning,
      lastCheck: status.lastCheck,
      upcomingSchedules,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}