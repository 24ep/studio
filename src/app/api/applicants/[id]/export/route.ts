export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { handleExportApplicant } from './applicant-export-handler';
import type { ApplicantExportRouteContext } from './applicant-export-request';

export function GET(request: NextRequest, context: ApplicantExportRouteContext) {
  return handleExportApplicant(request, context);
}
