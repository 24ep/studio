export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleApplicantSourceOptions,
  handleGetApplicantSource,
  handleUpdateApplicantSource,
} from './applicant-source-v1-handlers';
import type { ApplicantSourceRouteContext } from './applicant-source-v1-schema';

/**
 * @openapi
 * /api/v1/applicants/{id}/source:
 *   get:
 *     summary: Get Applicant source information
 *   put:
 *     summary: Update Applicant source
 *   options:
 *     summary: CORS preflight
 */
export function GET(request: NextRequest, context: ApplicantSourceRouteContext) {
  return handleGetApplicantSource(request, context);
}

export function PUT(request: NextRequest, context: ApplicantSourceRouteContext) {
  return handleUpdateApplicantSource(request, context);
}

export function OPTIONS(request: NextRequest) {
  return handleApplicantSourceOptions(request);
}
