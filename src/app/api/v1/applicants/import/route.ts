export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleV1ApplicantImportGet,
  handleV1ApplicantImportOptions,
  handleV1ApplicantImportPost,
} from './applicants-import-v1-handlers';

export function POST(request: NextRequest) {
  return handleV1ApplicantImportPost(request);
}

export function GET(request: NextRequest) {
  return handleV1ApplicantImportGet(request);
}

export function OPTIONS(request: NextRequest) {
  return handleV1ApplicantImportOptions(request);
}
