import { scheduler } from './scheduler';
import { prisma } from './prisma';

export class BackgroundWorker {
  private static instance: BackgroundWorker;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private checkInterval: number = 60000; // Check every minute

  static getInstance(): BackgroundWorker {
    if (!BackgroundWorker.instance) {
      BackgroundWorker.instance = new BackgroundWorker();
    }
    return BackgroundWorker.instance;
  }

  // Start the background worker
  start() {
    if (this.isRunning) {
      console.log('🔄 Background worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting background worker for schedule execution...');
    
    // Immediate first check
    this.executeCheck();
    
    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.executeCheck();
    }, this.checkInterval);

    // Log the startup
    this.logWorkerActivity('background_worker_started', 'Background worker started successfully');
  }

  // Stop the background worker
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('⏹️ Background worker stopped');
    
    // Log the shutdown
    this.logWorkerActivity('background_worker_stopped', 'Background worker stopped');
  }

  // Check and execute due schedules
  private async executeCheck() {
    try {
      console.log('⏰ Background worker checking for due schedules...');
      
      // Check if there are any due schedules
      const dueSchedules = await prisma.schedule.count({
        where: {
          isActive: true,
          nextRun: {
            lte: new Date()
          }
        }
      });

      if (dueSchedules === 0) {
        console.log('📅 No schedules due for execution');
        return;
      }

      console.log(`📋 Found ${dueSchedules} due schedules, executing...`);
      
      // Execute the schedules using the scheduler
      const results = await scheduler.executeSchedules();
      
      if (results.length > 0) {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`✅ Background worker completed execution: ${successful} successful, ${failed} failed`);
        
        // Log the execution
        await this.logWorkerActivity(
          'background_execution_completed',
          `Background execution completed: ${successful} successful, ${failed} failed out of ${results.length} total`
        );
      }

    } catch (error) {
      console.error('❌ Background worker execution error:', error);
      
      // Log the error
      await this.logWorkerActivity(
        'background_worker_error',
        `Background worker error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Log worker activities
  private async logWorkerActivity(action: string, details: string) {
    try {
      await prisma.adminLog.create({
        data: {
          action,
          details
        }
      });
    } catch (error) {
      console.error('Failed to log worker activity:', error);
    }
  }

  // Get worker status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: new Date().toISOString()
    };
  }

  // Update check interval
  setCheckInterval(intervalMs: number) {
    if (intervalMs < 30000) { // Minimum 30 seconds
      throw new Error('Check interval must be at least 30 seconds');
    }

    this.checkInterval = intervalMs;
    
    // Restart with new interval if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`🔧 Background worker check interval updated to ${intervalMs}ms`);
  }
}

// Export singleton instance
export const backgroundWorker = BackgroundWorker.getInstance();