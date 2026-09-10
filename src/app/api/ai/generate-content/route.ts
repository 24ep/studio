import { type NextRequest } from 'next/server';
import { handleGenerateContentPost } from './generate-content-workflow';

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handleGenerateContentPost(request);
}
