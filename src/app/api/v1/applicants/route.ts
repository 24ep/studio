import { type NextRequest } from 'next/server';
import { handleCreateV1Applicant } from './applicants-v1-create';
import { handleListV1Applicants } from './applicants-v1-list';
import { handleV1ApplicantsOptions } from './applicants-v1-options';

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handleCreateV1Applicant(request);
}

export function GET(request: NextRequest) {
  return handleListV1Applicants(request);
}

export function OPTIONS(request: NextRequest) {
  return handleV1ApplicantsOptions(request);
}
