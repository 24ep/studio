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

// Enhanced statistics tracking
let stats = {
  startTime: new Date(),
  totalJobsProcessed: 0,
  successfulJobs: 0,
  failedJobs: 0,
  totalErrors: 0,
  lastJobTime: null as Date | null,
  consecutiveErrors: 0,
  maxConsecutiveErrors: 0,
  averageProcessingTime: 0,
  processingTimes: [] as number[],
};

function logStats() {
  const now = new Date();
  const uptime = Math.floor((now.getTime() - stats.startTime.getTime()) / 1000);
  const mem = process.memoryUsage();
  const avgProcessingTime = stats.processingTimes.length > 0
    ? stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length
    : 0;

  console.log('='.repeat(80));
  console.log(`📊 PROCESSOR STATS - ${now.toISOString()}`);
  console.log('='.repeat(80));
  console.log(`⏱️  Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
  console.log(`📈 Total Jobs Processed: ${stats.totalJobsProcessed}`);
  console.log(`✅ Successful Jobs: ${stats.successfulJobs}`);
  console.log(`❌ Failed Jobs: ${stats.failedJobs}`);
  console.log(`⚠️  Total Errors: ${stats.totalErrors}`);
  console.log(`🔄 Consecutive Errors: ${stats.consecutiveErrors}`);
  console.log(`📊 Max Consecutive Errors: ${stats.maxConsecutiveErrors}`);
  console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(2)}ms`);
  console.log(`💾 Memory Usage: RSS ${(mem.rss/1024/1024).toFixed(2)}MB, Heap ${(mem.heapUsed/1024/1024).toFixed(2)}MB/${(mem.heapTotal/1024/1024).toFixed(2)}MB`);
  console.log(`🔧 Configuration: Interval=${BASE_INTERVAL_MS}ms`);
  console.log(`🌐 Target URL: ${PROCESS_URL}`);
  console.log('='.repeat(80));
}

function logHealthCheck() {
  const now = new Date();
  const uptime = Math.floor((now.getTime() - stats.startTime.getTime()) / 1000);
  const mem = process.memoryUsage();

  console.log(`💓 HEALTH CHECK - ${now.toISOString()} - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
  console.log(`   Memory: RSS ${(mem.rss/1024/1024).toFixed(2)}MB, Heap ${(mem.heapUsed/1024/1024).toFixed(2)}MB/${(mem.heapTotal/1024/1024).toFixed(2)}MB`);
  console.log(`   Jobs: ${stats.totalJobsProcessed} total, ${stats.successfulJobs} success, ${stats.failedJobs} failed`);
  console.log(`   Errors: ${stats.consecutiveErrors} consecutive, ${stats.maxConsecutiveErrors} max`);
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
  const startTime = Date.now();
  try {
    res = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey }
    });
    const text = await res.text();
    const processingTime = Date.now() - startTime;

    if (!res.ok) {
      console.error(`❌ HTTP Error: ${res.status} - ${res.statusText} (${processingTime}ms)`);
      console.error(`   Response body:`, text);
      stats.failedJobs++;
      stats.totalErrors++;
      stats.consecutiveErrors++;
      stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
      return false;
    }

    if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
      console.error(`❌ HTML Response Error (${processingTime}ms): Received HTML instead of JSON`);
      console.error(`   HTTP status: ${res.status}`);
      console.error(`   Response text: ${text.substring(0, 500)}`);
      stats.failedJobs++;
      stats.totalErrors++;
      stats.consecutiveErrors++;
      stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
      return false;
    }

    try {
      const data = JSON.parse(text);
      if (typeof data === 'object' && data !== null && 'message' in data && (data as any).message === 'No queued jobs') {
        console.log(`⏳ No jobs available (${processingTime}ms)`);
        stats.consecutiveErrors = 0; // Reset on successful check
        return false;
      } else {
        console.log(`✅ Processed job: ${JSON.stringify(data).substring(0, 200)}... (${processingTime}ms)`);
        stats.successfulJobs++;
        stats.consecutiveErrors = 0;
        return true;
      }
    } catch (err: any) {
      console.error(`❌ JSON Parse Error (${processingTime}ms): Could not parse response`);
      console.error(`   HTTP status: ${res.status}`);
      console.error(`   Response text: ${text}`);
      console.error(`   JSON parse error: ${err.message}`);
      stats.failedJobs++;
      stats.totalErrors++;
      stats.consecutiveErrors++;
      stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
      return false;
    }
  } catch (err: any) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Network Error (${processingTime}ms): ${err.message}`);
    if (err.stack) console.error(`   Error stack: ${err.stack}`);
    stats.failedJobs++;
    stats.totalErrors++;
    stats.consecutiveErrors++;
    stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
    return false;
  } finally {
    const processingTime = Date.now() - startTime;
    stats.totalJobsProcessed++;
    stats.lastJobTime = new Date();
    stats.processingTimes.push(processingTime);
    // Keep only last 100 processing times for average calculation
    if (stats.processingTimes.length > 100) {
      stats.processingTimes = stats.processingTimes.slice(-100);
    }
  }
}

async function runProcessorLoop(): Promise<never> {
  let backoff = BASE_INTERVAL_MS;
  const apiKey = process.env.PROCESSOR_API_KEY || '';
  let lastStatsLog = Date.now();
  let lastHealthCheck = Date.now();
  while (true) {
    const loopStartTime = Date.now();
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
    // Log health check every 60 seconds
    if (Date.now() - lastHealthCheck > 60000) {
      logHealthCheck();
      lastHealthCheck = Date.now();
    }
    // Log detailed stats at regular intervals
    if (Date.now() - lastStatsLog > 30000) {
      logStats();
      lastStatsLog = Date.now();
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    const loopTime = Date.now() - loopStartTime;
    if (hadError) {
      console.log(`Backing off for ${backoff}ms due to error (loop took ${loopTime}ms)...`);
    } else {
      console.log(`Waiting ${backoff}ms until next cycle (loop took ${loopTime}ms)...`);
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

// Enhanced error handling for uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  logStats();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  logStats();
  process.exit(1);
});

// Export to make this a module
export {}; 