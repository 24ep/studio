import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  try {
    // Check Redis connection
    await redis.ping();
    
    return NextResponse.json(
      { status: 'healthy', redis: 'connected' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Redis connection failed' },
      { status: 500 }
    );
  }
} 