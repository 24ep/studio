export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleExportErrorAnalysis } from './error-analysis-export-handlers';

export function GET(request: NextRequest) {
  return handleExportErrorAnalysis(request);
}
