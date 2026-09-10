export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';
import { ensureRequiredRecruitmentStages } from '@/lib/recruitment-stage-system';
import { SimpleErrorHandler,
  createUnauthorizedError,
  createInternalServerError
} from '@/lib/errors';;

/**
 * @openapi
 * /api/v1/recruitment-stages:
 *   get:
 *     summary: Get all recruitment stages (V1 API)
 *     description: Returns all recruitment stages for use in filters. Requires Bearer token authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recruitment stages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       sort_order:
 *                         type: integer
 *                       color_complete:
 *                         type: string
 *                       color_badge:
 *                         type: string
 *                       is_system:
 *                         type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 path:
 *                   type: string
 *                 method:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "123e4567-e89b-12d3-a456-426614174000"
 *                       name: "Applied"
 *                       description: "Applicant has applied"
 *                       sort_order: 1
 *                       color_complete: "#4CAF50"
 *                       color_badge: "#2E7D32"
 *                       is_system: true
 *                     - id: "123e4567-e89b-12d3-a456-426614174001"
 *                       name: "Interview"
 *                       description: "Applicant in interview process"
 *                       sort_order: 2
 *                       color_complete: "#FF9800"
 *                       color_badge: "#E65100"
 *                       is_system: true
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   path: "/api/v1/recruitment-stages"
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

    const client = await getPool().connect();
    try {
      await ensureRequiredRecruitmentStages(client);
      const result = await client.query(
        'SELECT id, name, description, sort_order, color_complete, color_badge, is_system FROM "RecruitmentStage" ORDER BY sort_order ASC, name ASC'
      );
      
      return SimpleErrorHandler.createSuccessResponse(req, result.rows, 200);
    } finally {
      client.release();
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Failed to fetch recruitment stages: ${errorMessage}`));
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}
