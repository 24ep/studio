import fetch from 'node-fetch';

const INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000'); // 5 seconds default
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
  console.log(`Starting background processor with interval: ${INTERVAL_MS}ms`);
  console.log(`Processor URL: ${PROCESS_URL}`);
  const apiKey = process.env.PROCESSOR_API_KEY || '';
  while (true) {
    try {
      const maxConcurrent = await getMaxConcurrentProcessors();
      console.log('Max concurrent processors:', maxConcurrent);
      const jobs = Array.from({ length: maxConcurrent });
      const results = await Promise.all(jobs.map(() => processJob(apiKey)));
      if (results.every(r => r === false)) {
        console.log('No queued jobs found, waiting...');
      }
    } catch (err) {
      console.error('Background processor error:', err);
    }
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
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