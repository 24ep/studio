export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getSafeDbClient } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';
import { SimpleErrorHandler,
  createUnauthorizedError,
  createForbiddenError,
  createInternalServerError
} from '@/lib/errors';;

/**
 * @openapi
 * /api/v1/job-match-status:
 *   get:
 *     summary: Check job match function status (V1 API)
 *     description: Returns whether the job match function is enabled or disabled. Requires Bearer token authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job match function status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isJobMatchEnabled:
 *                       type: boolean
 *                       description: Whether the job match function is enabled
 *                       example: true
 *                     settingValue:
 *                       type: string
 *                       description: The raw setting value from the database
 *                       example: "true"
 *                     defaultBehavior:
 *                       type: string
 *                       description: Explanation of the default behavior
 *                       example: "Feature is enabled by default unless explicitly set to 'false'"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 path:
 *                   type: string
 *                 method:
 *                   type: string
 *                 statusCode:
 *                   integer
 *             examples:
 *               enabled:
 *                 summary: Job match function enabled
 *                 value:
 *                   success: true
 *                   data:
 *                     isJobMatchEnabled: true
 *                     settingValue: "true"
 *                     defaultBehavior: "Feature is enabled by default unless explicitly set to 'false'"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   path: "/api/v1/job-match-status"
 *                   method: "GET"
 *                   statusCode: 200
 *               disabled:
 *                 summary: Job match function disabled
 *                 value:
 *                   success: true
 *                   data:
 *                     isJobMatchEnabled: false
 *                     settingValue: "false"
 *                     defaultBehavior: "Feature is enabled by default unless explicitly set to 'false'"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   path: "/api/v1/job-match-status"
 *                   method: "GET"
 *                   statusCode: 200
 *       401:
 *         description: Unauthorized - Invalid or missing Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized - Invalid or expired token"
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = token ? await verifyApiToken(token) : null;
    
    if (!user) {
      return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
    }

    const client = await getSafeDbClient();
    try {
      // Check if the jobMatchFeatureEnabled setting exists
      const settingResult = await client.query(`
        SELECT value 
        FROM "SystemSetting" 
        WHERE key = 'jobMatchFeatureEnabled'
      `);

      let settingValue = settingResult.rows[0]?.value;
      let isJobMatchEnabled: boolean;

      // Default behavior: feature is enabled unless explicitly set to 'false'
      if (settingValue === null || settingValue === undefined) {
        // Setting doesn't exist, default to enabled
        isJobMatchEnabled = true;
        settingValue = 'default';
      } else {
        // Setting exists, check if it's explicitly disabled
        isJobMatchEnabled = settingValue !== 'false';
      }

      const statusData = {
        isJobMatchEnabled,
        settingValue: settingValue?.toString() || 'default',
        value: settingValue?.toString() || 'default',
        defaultBehavior: "Feature is enabled by default unless explicitly set to 'false'"
      };

      return SimpleErrorHandler.createSuccessResponse(req, statusData, 200);
    } finally {
      client.release();
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Failed to check job match status: ${errorMessage}`));
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}
