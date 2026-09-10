import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { requirePositionViewSession } from './position-detail-auth';
import { connectPositionDb, POSITION_DETAIL_SELECT, shapePositionDetail } from './position-detail-data';
import { type PositionRouteContext } from './position-detail-schema';
import type { PositionDetailRow } from './position-detail-data';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

export async function handleGetPositionDetail(_request: NextRequest, { params }: PositionRouteContext) {
  const authorization = await requirePositionViewSession();
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in positions GET request:', id);
    return NextResponse.json({ message: 'Invalid position ID format' }, { status: 400 });
  }

  const client = await connectPositionDb();
  if (client instanceof NextResponse) {
    return client;
  }

  try {
    const result = await client.query<PositionDetailRow>(POSITION_DETAIL_SELECT, [id]);

    if (result.rows.length === 0) {
      console.error(`[Positions API] Position not found: ${id}`);
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json(shapePositionDetail(result.rows[0]));
  } catch (error) {
    console.error(`[Positions API] Database error fetching position ${id}:`, error);
    return NextResponse.json({
      message: 'Error fetching position',
      error: getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? getErrorStack(error) : undefined,
    }, { status: 500 });
  } finally {
    client.release();
  }
}
