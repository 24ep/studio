export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getMergedUserPermissions } from '@/lib/db';

import { auth } from '@/auth';
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force fetch fresh permissions from database
    const freshPermissions = await getMergedUserPermissions(session.user.id);
    
    // console.log(`[FORCE REFRESH] User ${session.user.id} permissions refreshed:`, {
    //   previous: session.user.modulePermissions || [],
    //   fresh: freshPermissions
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Permissions force refreshed. You may need to sign out and sign back in for changes to take effect.',
      previousPermissions: session.user.modulePermissions || [],
      freshPermissions: freshPermissions,
      permissionsChanged: JSON.stringify(session.user.modulePermissions || []) !== JSON.stringify(freshPermissions)
    });

  } catch (error) {
    console.error('Error force refreshing permissions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to force refresh permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
