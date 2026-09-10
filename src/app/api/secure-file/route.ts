import type { NextRequest } from 'next/server';
import { handleSecureFileGet } from './secure-file-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleSecureFileGet(request);
}
