import { type NextRequest } from 'next/server';
import { handleBulkUploadCv } from './bulk-upload-cv-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST(request: NextRequest) {
  return handleBulkUploadCv(request);
}
