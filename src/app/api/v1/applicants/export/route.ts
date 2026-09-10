export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';
import { canExportApplicantsV1, getBearerToken } from './applicants-v1-export-auth';
import { buildApplicantsV1ExportCsv, type ApplicantExportRow } from './applicants-v1-export-format';

export async function GET(req: NextRequest) {
  const token = getBearerToken(req.headers.get('authorization'));
  const user = token ? await verifyApiToken(token) : null;
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: handleCors(req) });
  }

  if (!canExportApplicantsV1(user)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to export Applicants' }), { status: 403, headers: handleCors(req) });
  }

  const client = await getPool().connect();
  try {
    const query = `
      SELECT 
        c.*,
        p.title as "positionTitle", 
        p.department as "positionDepartment", 
        r.name as "recruiterName",
        COALESCE(
          json_agg(
            json_build_object(
              'jobTitle', jm."jobTitle",
              'fitScore', jm."fitScore",
              'matchReasons', jm."matchReasons",
              'jobDescriptionSummary', jm."job_description_summary"
            ) ORDER BY jm."fitScore" DESC NULLS LAST
          ) FILTER (WHERE jm.id IS NOT NULL),
          '[]'::json
        ) as job_matches
      FROM "Applicant" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" r ON c."recruiterId" = r.id
      LEFT JOIN "JobMatch" jm ON c.id = jm."applicant_id"
      GROUP BY c.id, p.title, p.department, r.name
      ORDER BY c."updatedAt" DESC
    `;
    const result = await client.query<ApplicantExportRow>(query);
    const csvContent = buildApplicantsV1ExportCsv(result.rows);
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...handleCors(req),
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="Applicants-export.csv"'
      }
    });
    
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'Error exporting Applicants', details }), { status: 500, headers: handleCors(req) });
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 

