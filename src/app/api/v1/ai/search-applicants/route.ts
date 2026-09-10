import { type NextRequest } from 'next/server';
import { handleSearchApplicantsV1, handleSearchApplicantsV1Options } from './search-applicants-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/v1/ai/search-applicants:
 *   post:
 *     summary: Search Applicants using AI (V1 API)
 *     description: Search Applicants using AI-powered semantic search. Requires Bearer token authentication.
 *   options:
 *     summary: CORS preflight for AI Applicant search
 */
export function POST(request: NextRequest) {
  return handleSearchApplicantsV1(request);
}

export function OPTIONS(request: NextRequest) {
  return handleSearchApplicantsV1Options(request);
}
