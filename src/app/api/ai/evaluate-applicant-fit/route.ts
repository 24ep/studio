export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleEvaluateApplicantFit } from './evaluate-applicant-fit-handler';

export function POST(request: NextRequest) {
  return handleEvaluateApplicantFit(request);
}
