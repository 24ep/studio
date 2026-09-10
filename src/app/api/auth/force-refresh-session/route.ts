export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Create a response that clears the session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session cleared. Please sign in again to refresh permissions.',
    });

    // Clear the session cookie
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Secure-next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');

    return response;

  } catch (error) {
    console.error('Error forcing session refresh:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to force refresh session' 
    }, { status: 500 });
  }
}
