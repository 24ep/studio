import { type NextRequest } from 'next/server';
import { handleSecureFileStreamGet } from './secure-file-stream-handler';
import { handleStreamOptions } from './secure-file-stream-headers';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: NextRequest) {
  return handleStreamOptions(request);
}

export function GET(request: NextRequest) {
  return handleSecureFileStreamGet(request);
}

