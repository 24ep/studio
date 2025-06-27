import { NextResponse } from 'next/server';
import { initializeApplication } from '@/lib/startup';
import { logAudit } from '@/lib/auditLog';

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
    
    await logAudit('INFO', 'Application initialization started via API', 'API:Setup:Initialize:Post', null);
    
    const result = await initializeApplication();
    
    console.log('✅ Application initialization completed via API');
    
    await logAudit('AUDIT', `Application initialization completed via API. Status: ${result.overall}`, 'API:Setup:Initialize:Post', null, { 
      status: result.overall,
      minioStatus: result.minio?.status,
      databaseStatus: result.database?.status 
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Application initialization failed via API:', error);
    
    await logAudit('ERROR', `Application initialization failed via API. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'API:Setup:Initialize:Post', null, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json({ 
      error: 'Failed to initialize application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('🔍 Checking application status...');
    
    await logAudit('INFO', 'Application status check started via API', 'API:Setup:Initialize:Get', null);
    
    const result = await initializeApplication();
    
    console.log('✅ Application status check completed');
    
    await logAudit('AUDIT', `Application status check completed via API. Status: ${result.overall}`, 'API:Setup:Initialize:Get', null, { 
      status: result.overall,
      minioStatus: result.minio?.status,
      databaseStatus: result.database?.status 
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Application status check failed:', error);
    
    await logAudit('ERROR', `Application status check failed via API. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'API:Setup:Initialize:Get', null, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json({ 
      error: 'Failed to check application status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 