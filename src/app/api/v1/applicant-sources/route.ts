import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';
import { getPool } from '@/lib/db';
import { SimpleErrorHandler } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/Applicant-sources
 * Get all Applicant sources
 */
export async function GET(req: NextRequest) {
  try {
    // Verify API token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = token ? await verifyApiToken(token) : null;
    
    if (!user) {
      return SimpleErrorHandler.createErrorResponse(req, 'Unauthorized - Invalid or missing Bearer token', 401);
    }

 

    // Get Applicant sources from database
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT 
          id, name, description, email, logo, allow_sub_source as "allowSubSource", 
          sort_order as "sortOrder", is_active as "isActive", 
          "createdAt", "updatedAt"
        FROM "ApplicantSource"
        ORDER BY sort_order ASC, name ASC
      `);
      
      return SimpleErrorHandler.createSuccessResponse(req, {
        data: result.rows
      }, 200);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching Applicant sources:', error);
    return SimpleErrorHandler.createErrorResponse(req, 'Internal server error', 500);
  }
}
