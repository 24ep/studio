// src/app/api/applicants/export/route.ts
import { type NextRequest } from 'next/server';
import { handleExportApplicantsGet } from './applicants-export-route-get';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/applicants/export:
 *   get:
 *     summary: Export Applicants
 *     description: Export all Applicants with position names, recruiter names, applied job information, and job matches.
 */
export function GET(request: NextRequest) {
  return handleExportApplicantsGet(request);
}
