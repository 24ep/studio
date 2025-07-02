// Use built-in fetch API (available in Node.js 18+)
// No import needed - fetch is globally available

// Validate and parse interval
const BASE_INTERVAL_MS_RAW = process.env.PROCESSOR_INTERVAL_MS;
let BASE_INTERVAL_MS = 5000;
if (BASE_INTERVAL_MS_RAW) {
  const parsed = parseInt(BASE_INTERVAL_MS_RAW, 10);
  if (!isNaN(parsed) && parsed > 0) {
    BASE_INTERVAL_MS = parsed;
  } else {
    console.warn('Invalid PROCESSOR_INTERVAL_MS, using default 5000ms');
  }
}
const MAX_BACKOFF_MS = 60000; // 1 minute max
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';

// Exit if API key is not set
if (!process.env.PROCESSOR_API_KEY) {
  console.error('PROCESSOR_API_KEY is not set! Exiting.');
  process.exit(1);
}

interface ProcessResponse {
  message?: string;
  [key: string]: any;
}

async function getMaxConcurrentProcessors(): Promise<number> {
  // Allow override by environment variable
  if (process.env.MAX_CONCURRENT_PROCESSORS) {
    const envValue = parseInt(process.env.MAX_CONCURRENT_PROCESSORS, 10);
    if (!isNaN(envValue) && envValue > 0) return envValue;
    else console.warn('Invalid MAX_CONCURRENT_PROCESSORS, using default 5');
  }
  try {
    const res = await fetch('http://app:9846/api/settings/system-settings');
    if (!res.ok) throw new Error('Failed to fetch system settings');
    const settings = await res.json();
    const found = Array.isArray(settings)
      ? settings.find((s: any) => s.key === 'maxConcurrentProcessors')
      : null;
    const value = found ? parseInt(found.value, 10) : 5;
    return isNaN(value) || value <= 0 ? 5 : value;
  } catch {
    return 5;
  }
}

async function processJob(apiKey: string) {
  let res;
  try {
    res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey }
    });
  } catch (err) {
    console.error('Network error calling process endpoint:', err);
    return false;
  }
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errorText = '';
    try {
      errorText = await res.text();
    } catch {}
    console.error(`Process job failed: HTTP ${res.status} - ${res.statusText}`);
    console.error('Response body:', errorText);
    return false;
  }
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

// Export to make this a module
export {}; 