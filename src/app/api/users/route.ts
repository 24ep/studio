// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';
import { handleCreateUser } from './users-route-create';
import { handleGetUsers } from './users-route-list';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  }

  return handleGetUsers(request, session);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized: User session required.' },
      { status: 401 }
    );
  }

  if (!hasAnyPermission(session.user, ['USERS_CREATE'])) {
    await logAudit(
      'WARN',
      `Forbidden attempt to create user by ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required: USERS_CREATE permission.`,
      'API:Users:Create',
      session?.user?.id
    );
    return NextResponse.json(
      { message: 'Forbidden: You must have USERS_CREATE permission to create users.' },
      { status: 403 }
    );
  }

  return handleCreateUser(request, session);
}

