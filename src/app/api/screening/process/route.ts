import { NextRequest, NextResponse } from 'next/server';
import { isValidProcessorApiKey } from '@/lib/processor-auth';
import { processNextScreeningCase } from '@/lib/screening/service';

export async function POST(request: NextRequest) {
  if (!isValidProcessorApiKey(request.headers.get('x-api-key'))) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const processedCaseId = await processNextScreeningCase();
  return NextResponse.json({ processedCaseId });
}
