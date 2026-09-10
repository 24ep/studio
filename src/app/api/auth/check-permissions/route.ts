import { NextRequest, NextResponse } from 'next/server';
import { hasAnyPermission } from '@/lib/permissions';
import { getJsonArray } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        hasPermission: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const permissions = getJsonArray(body, 'permissions');

    if (!permissions) {
      return NextResponse.json({ 
        hasPermission: false, 
        error: 'Invalid permissions format' 
      }, { status: 400 });
    }

    const permissionNames = permissions.filter((permission): permission is string => (
      typeof permission === 'string'
    ));

    const userRole = session.user.role || 'Recruiter';
    const userModulePermissions = session.user.modulePermissions || [];

    // Check whether the user holds one of the requested permissions.
    const hasAnyPermissionResult = hasAnyPermission(session.user, permissionNames);

    return NextResponse.json({
      hasPermission: hasAnyPermissionResult,
      userRole,
      userModulePermissions,
      requestedPermissions: permissionNames
    });

  } catch (error) {
    console.error('Permission check failed:', error);
    return NextResponse.json({ 
      hasPermission: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
