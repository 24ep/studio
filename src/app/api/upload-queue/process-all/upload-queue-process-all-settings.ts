import { NextResponse } from 'next/server';
import { getSystemSetting } from '@/lib/systemSettings';
import { getMaxConcurrentProcessors, MAX_PROCESSING_TIME_MS } from '../process/upload-queue-process-settings';

export { MAX_PROCESSING_TIME_MS };

export async function getProcessAllMaxConcurrent() {
  return getMaxConcurrentProcessors();
}

export async function getQueueDisabledResponse() {
  try {
    const queueEnabled = await getSystemSetting('processQueueEnabled');
    if (queueEnabled !== 'false') {
      return null;
    }

    return NextResponse.json({
      message: 'Process queue is disabled',
      enabled: false,
      processed_count: 0,
      processed: [],
      messages: ['Process queue is disabled'],
    }, { status: 200 });
  } catch (error) {
    console.warn('Failed to check process queue enabled status:', error);
    return null;
  }
}

export function hasProcessingTimedOut(startTime: number) {
  return Date.now() - startTime > MAX_PROCESSING_TIME_MS;
}
