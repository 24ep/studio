export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { handlePreviewOptions } from './secure-file-preview-headers';
import { handleSecureFilePreviewGet } from './secure-file-preview-handler';

export function OPTIONS(request: NextRequest) {
  return handlePreviewOptions(request);
}

export function GET(request: NextRequest) {
  return handleSecureFilePreviewGet(request);
}
