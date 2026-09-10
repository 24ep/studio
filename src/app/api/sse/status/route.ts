import { NextRequest, NextResponse } from 'next/server';
import { getConnectionCount } from '@/lib/realtime';
import { getAllowedOrigin } from '@/lib/cors';
import { requireApiSession } from '@/lib/api-route-guards';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/sse/status:
 *   get:
 *     summary: Get SSE connection status
 *     description: Retrieve Server-Sent Events connection status and statistics
 *     tags: ['System', 'SSE']
 *     responses:
 *       200:
 *         description: SSE status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['connected', 'disconnected']
 *                 lastUpdate:
 *                   type: string
 *                 eventCount:
 *                   type: number
 *                 activeConnections:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { response } = await requireApiSession();
    if (response) return response;

    const totalConnections = getConnectionCount();
    const sseStatus = {
      status: totalConnections > 0 ? 'connected' : 'disconnected',
      lastUpdate: new Date().toISOString(),
      activeConnections: totalConnections,
      connectedUsers: null,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleTimeString()
    };

    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(request);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return NextResponse.json(sseStatus, { headers });
  } catch (error) {
    console.error('[SSE STATUS] Error:', error);
    
    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(request);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to get SSE status',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers
      }
    );
  }
}
