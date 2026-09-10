export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { readRequestJsonObject } from '@/lib/request-json';

/**
 * NextAuth internal logging endpoint
 * Public endpoint that handles NextAuth's internal logging requests to prevent 500 errors.
 */
export async function POST(request: NextRequest) {
  try {
    await readRequestJsonObject(request);
    
    // Return a simple success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NextAuth Log Error]:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  // Public endpoint for build/proxy probes only; no diagnostic data is exposed.
  return NextResponse.json({ success: true });
} 
