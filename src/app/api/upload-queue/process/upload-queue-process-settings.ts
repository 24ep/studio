import { getSystemSetting } from '@/lib/systemSettings';

export const MAX_PROCESSING_TIME_MS = 30 * 60 * 1000;
export const STUCK_JOB_TIMEOUT_HOURS = 1;
export const RECENT_PROCESSING_TIMEOUT_MINUTES = 5;

export async function getMaxConcurrentProcessors(): Promise<number> {
  let maxConcurrent = 5;

  try {
    const setting = await getSystemSetting('maxConcurrentProcessors');
    if (setting && !isNaN(Number(setting)) && Number(setting) > 0) {
      maxConcurrent = Number(setting);
    } else {
      console.warn(`Invalid maxConcurrentProcessors setting: ${setting}, using default: ${maxConcurrent}`);
    }
  } catch (error) {
    console.error('Failed to get maxConcurrentProcessors setting:', error);
  }

  if (maxConcurrent <= 0) {
    console.error('maxConcurrentProcessors is 0 or negative, forcing to 1');
    return 1;
  }

  return maxConcurrent;
}

export async function buildAutoRetryCondition(): Promise<string> {
  const retryEnabled = await getSystemSetting('queueRetryEnabled') === 'true';
  const retryDelayRaw = await getSystemSetting('queueRetryDelaySeconds');
  const maxRetriesRaw = await getSystemSetting('queueMaxRetries');
  const retryDelaySeconds = retryDelayRaw ? parseInt(retryDelayRaw, 10) : 0;
  const maxRetries = maxRetriesRaw ? parseInt(maxRetriesRaw, 10) : 0;

  if (!retryEnabled || retryDelaySeconds <= 0 || maxRetries <= 0) {
    return '1=0';
  }

  return `(
    status = 'failed'
    AND retry_count < ${maxRetries}
    AND updated_at < NOW() - INTERVAL '${retryDelaySeconds} seconds'
  )`;
}
