// To run as ESM: rename this file to .mjs or set "type": "module" in package.json
import fetch from 'node-fetch';
const BASE_INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000');
const MAX_BACKOFF_MS = 60000; // 1 minute max
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';
const API_KEY = process.env.PROCESSOR_API_KEY;

if (!API_KEY) {
    console.error('ERROR: PROCESSOR_API_KEY environment variable is not set!');
    process.exit(1);
}

async function getMaxConcurrentProcessors() {
    // Allow override by environment variable
    if (process.env.MAX_CONCURRENT_PROCESSORS) {
        const envValue = parseInt(process.env.MAX_CONCURRENT_PROCESSORS, 10);
        if (!isNaN(envValue) && envValue > 0) return envValue;
    }
    try {
        const res = await fetch('http://app:9846/api/settings/system-settings');
        if (!res.ok)
            throw new Error('Failed to fetch system settings');
        const settings = await res.json();
        const value = settings.maxConcurrentProcessors ? parseInt(settings.maxConcurrentProcessors, 10) : 5;
        return isNaN(value) ? 5 : value;
    } catch (e) {
        return 5;
    }
}

async function processJob() {
    try {
        const res = await fetch(PROCESS_URL, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const text = await res.text();
        if (!res.ok) {
            console.error(`HTTP Error: ${res.status} - ${res.statusText}`);
            console.error(`Response body:`, text);
            return false;
        }
        if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
            console.error('Background processor error: Received HTML instead of JSON. This usually means the API route failed or returned an error page.');
            console.error('HTTP status:', res.status);
            console.error('Response text:', text.substring(0, 500));
            return false;
        }
        try {
            const data = JSON.parse(text);
            if (data && data.message === 'No queued jobs') {
                return false;
            } else {
                console.log('Processed job:', data);
                return true;
            }
        } catch (err) {
            console.error('Background processor error: Could not parse JSON. Response was:');
            console.error('HTTP status:', res.status);
            console.error('Response text:', text);
            console.error('JSON parse error:', err.message);
            return false;
        }
    } catch (err) {
        console.error('Background processor error:', err.message);
        console.error('Error stack:', err.stack);
        return false;
    }
}

async function runProcessorLoop() {
    let backoff = BASE_INTERVAL_MS;
    while (true) {
        let hadError = false;
        // Log memory usage at the start of each loop
        const mem = process.memoryUsage();
        console.log('[Memory Usage]', `rss: ${(mem.rss/1024/1024).toFixed(2)} MB, heapUsed: ${(mem.heapUsed/1024/1024).toFixed(2)} MB, heapTotal: ${(mem.heapTotal/1024/1024).toFixed(2)} MB, external: ${(mem.external/1024/1024).toFixed(2)} MB`);
        try {
            const maxConcurrent = await getMaxConcurrentProcessors();
            console.log('Max concurrent processors:', maxConcurrent);
            const jobs = Array.from({ length: maxConcurrent });
            await Promise.all(jobs.map(() => processJob()));
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
