import { type NextRequest } from 'next/server';
import { handleGetApplicantImportTemplate } from './applicants-import-get';
import { handleImportApplicantsPost } from './applicants-import-post';

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handleImportApplicantsPost(request);
}

export function GET() {
  return handleGetApplicantImportTemplate();
}
