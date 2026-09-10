import { NextResponse } from 'next/server';
import { initializeApplication } from '@/lib/startup';
import { logAudit } from '@/lib/auditLog';
import { requireApiPermission } from '@/lib/api-route-guards';

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

export const dynamic = 'force-dynamic';

function getSetupErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST() {
  try {
    const { response, session } = await requireApiPermission('SYSTEM_SETTINGS_EDIT');
    if (response) return response;

    await logAudit('INFO', 'Application initialization started via API', 'API:Setup:Initialize:Post', session.user.id);

    const result = await initializeApplication();

    await logAudit(
      'AUDIT',
      `Application initialization completed via API. Status: ${result.overall}`,
      'API:Setup:Initialize:Post',
      session.user.id,
      {
        status: result.overall,
        minioStatus: result.minio?.status,
        databaseStatus: result.database?.status,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = getSetupErrorMessage(error);
    console.error('Application initialization failed via API:', error);

    await logAudit('ERROR', `Application initialization failed via API. Error: ${errorMessage}`, 'API:Setup:Initialize:Post', null, {
      error: errorMessage,
    });

    return NextResponse.json({
      error: 'Failed to initialize application',
      details: errorMessage,
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { response, session } = await requireApiPermission('SYSTEM_SETTINGS_VIEW');
    if (response) return response;

    await logAudit('INFO', 'Application status check started via API', 'API:Setup:Initialize:Get', session.user.id);

    const result = await initializeApplication();

    await logAudit(
      'AUDIT',
      `Application status check completed via API. Status: ${result.overall}`,
      'API:Setup:Initialize:Get',
      session.user.id,
      {
        status: result.overall,
        minioStatus: result.minio?.status,
        databaseStatus: result.database?.status,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = getSetupErrorMessage(error);
    console.error('Application status check failed:', error);

    await logAudit('ERROR', `Application status check failed via API. Error: ${errorMessage}`, 'API:Setup:Initialize:Get', null, {
      error: errorMessage,
    });

    return NextResponse.json({
      error: 'Failed to check application status',
      details: errorMessage,
    }, { status: 500 });
  }
}
