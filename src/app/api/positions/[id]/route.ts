import { type NextRequest } from 'next/server';
import { handleDeletePosition } from './position-detail-delete';
import { handleGetPositionDetail } from './position-detail-get';
import { handleUpdatePosition } from './position-detail-update';
import { type PositionRouteContext } from './position-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/positions/{id}:
 *   get:
 *     summary: Get a position by ID
 *   put:
 *     summary: Update a position by ID
 *   delete:
 *     summary: Delete a position by ID
 */
export function GET(request: NextRequest, context: PositionRouteContext) {
  return handleGetPositionDetail(request, context);
}

export function PUT(request: NextRequest, context: PositionRouteContext) {
  return handleUpdatePosition(request, context);
}

export function DELETE(request: NextRequest, context: PositionRouteContext) {
  return handleDeletePosition(request, context);
}
