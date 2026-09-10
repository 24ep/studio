import { type NextRequest } from 'next/server';
import { handleProcessAllUploadQueueJobs } from './upload-queue-process-all-handler';

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handleProcessAllUploadQueueJobs(request);
}
