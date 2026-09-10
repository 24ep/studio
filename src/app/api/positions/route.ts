/**
 * @openapi
 * /api/positions:
 *   get:
 *     summary: Get all positions
 *     description: Returns a list of all positions.
 *   post:
 *     summary: Create a new position
 *     description: Creates a new position.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { handleCors } from '@/lib/cors';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import { handleCreatePosition } from './positions-route-create';
import { handleGetPositions } from './positions-route-list';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 });
  }

  return handleGetPositions(request, session);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id || null;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System (API Create)') as string;

  if (!session?.user || !hasPermission(session.user, 'POSITIONS_CREATE')) {
    await logAudit('WARN', `Forbidden attempt to create position by ${actingUserName}.`, 'API:Positions:Create', actingUserId);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403, headers: handleCors(request) });
  }

  return handleCreatePosition(request, session, actingUserId, actingUserName);
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new NextResponse(null, { status: 200, headers });
}
