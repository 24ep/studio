import fetch from 'node-fetch';

const BASE_INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000');
const MAX_BACKOFF_MS = 60000; // 1 minute max
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';

interface ProcessResponse {
  message?: string;
  [key: string]: any;
}

async function getMaxConcurrentProcessors(): Promise<number> {
  try {
    const res = await fetch('http://app:9846/api/settings/system-settings');
    if (!res.ok) throw new Error('Failed to fetch system settings');
    const settings = await res.json();
    const found = Array.isArray(settings)
      ? settings.find((s: any) => s.key === 'maxConcurrentProcessors')
      : null;
    const value = found ? parseInt(found.value, 10) : 5;
    return isNaN(value) ? 5 : value;
  } catch {
    return 5;
  }
}

async function processJob(apiKey: string) {
  const res = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: { 'x-api-key': apiKey }
  });
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (typeof data === 'object' && data !== null && 'message' in data && (data as any).message === 'No queued jobs') {
      return false;
    } else {
      console.log('Processed job:', data);
      return true;
    }
  } else {
    const text = await res.text();
    console.error('Expected JSON, got:', text);
    return false;
  }
}

async function runProcessorLoop(): Promise<never> {
  let backoff = BASE_INTERVAL_MS;
  const apiKey = process.env.PROCESSOR_API_KEY || '';
  while (true) {
    let hadError = false;
    // Log memory usage at the start of each loop
    const mem = process.memoryUsage();
    console.log('[Memory Usage]', `rss: ${(mem.rss/1024/1024).toFixed(2)} MB, heapUsed: ${(mem.heapUsed/1024/1024).toFixed(2)} MB, heapTotal: ${(mem.heapTotal/1024/1024).toFixed(2)} MB, external: ${(mem.external/1024/1024).toFixed(2)} MB`);
    try {
      const maxConcurrent = await getMaxConcurrentProcessors();
      console.log('Max concurrent processors:', maxConcurrent);
      const jobs = Array.from({ length: maxConcurrent });
      await Promise.all(jobs.map(() => processJob(apiKey)));
      backoff = BASE_INTERVAL_MS; // Reset backoff on success
    } catch (err) {
      hadError = true;
      console.error('Background processor error:', err);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS); // Exponential backoff
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    if (hadError) {
      console.log(`Backing off for ${backoff}ms due to error...`);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down background processor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down background processor...');
  process.exit(0);
});

console.log('Starting background processor...');
runProcessorLoop().catch(err => {
  console.error('Fatal error in background processor:', err);
  process.exit(1);
}); 