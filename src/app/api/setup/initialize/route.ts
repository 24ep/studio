import { NextResponse } from 'next/server';
import { initializeApplication } from '@/lib/startup';

/**
 * @openapi
 * /api/setup/initialize:
 *   post:
 *     summary: Initialize application services
 *     description: Initializes MinIO bucket and tests database connection
 *     tags: ['Setup'],
 *     responses:
 *       200:
 *         description: Application initialization result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['ready', 'partial', 'failed']
 *                 minio:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: ['success', 'warning', 'error']
 *                     message:
 *                       type: string
 *                     bucket:
 *                       type: string
 *                     error:
 *                       type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: ['success', 'error']
 *                     message:
 *                       type: string
 *                     error:
 *                       type: string
 *       500:
 *         description: Initialization error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log('🚀 Starting application initialization via API...');
    
    const result = await initializeApplication();
    
    console.log('✅ Application initialization completed via API');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Application initialization failed via API:', error);
    
    return NextResponse.json({ 
      error: 'Failed to initialize application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('🔍 Checking application status...');
    
    const result = await initializeApplication();
    
    console.log('✅ Application status check completed');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Application status check failed:', error);
    
    return NextResponse.json({ 
      error: 'Failed to check application status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 