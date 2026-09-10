export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { clearUserValidationCache } from '@/lib/auth';

import { auth } from '@/auth';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const userId = getJsonString(body, 'userId');
    
    // Only allow clearing cache for the current user
    if (userId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 403 });
    }

    // Clear the user validation cache
    clearUserValidationCache(userId);

    return NextResponse.json({
      success: true,
      message: 'User cache cleared successfully',
    });

  } catch (error) {
    console.error('Error clearing user cache:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear user cache' 
    }, { status: 500 });
  }
}
