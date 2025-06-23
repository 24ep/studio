import { NextResponse, type NextRequest } from 'next/server';

/**
 * @openapi
 * /api/realtime/collaboration-events:
 *   get:
 *     summary: Get collaboration events
 *     responses:
 *       200:
 *         description: Collaboration events data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
} 