import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application and its dependencies
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     userCount:
 *                       type: number
 *                       example: 5
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const client = await getPool().connect();
    let dbStatus = 'connected';
    let userCount = 0;
    
    try {
      // Test a simple query
      const result = await client.query('SELECT COUNT(*) as count FROM "User"');
      userCount = parseInt(result.rows[0].count);
    } catch (dbError) {
      console.error('[HEALTH CHECK] Database query failed:', dbError);
      dbStatus = 'error';
    } finally {
      client.release();
    }

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        userCount: userCount
      },
      uptime: process.uptime(),
      responseTime: responseTime
    });
  } catch (error) {
    console.error('[HEALTH CHECK] Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, { status: 500 });
  }
} 