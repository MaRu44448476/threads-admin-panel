import { NextResponse } from 'next/server';
import { backgroundWorker } from '@/lib/background-worker';

// This endpoint is called when the application starts up
export async function POST() {
  try {
    console.log('🌟 Application startup: Initializing background worker...');
    
    // Start the background worker
    backgroundWorker.start();
    
    return NextResponse.json({
      success: true,
      message: 'Background worker initialized successfully',
      status: backgroundWorker.getStatus()
    });
    
  } catch (error) {
    console.error('Failed to initialize background worker:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize background worker',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check for the background worker
export async function GET() {
  try {
    const status = backgroundWorker.getStatus();
    
    return NextResponse.json({
      success: true,
      worker: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get worker status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}