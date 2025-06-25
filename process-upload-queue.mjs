// To run as ESM: rename this file to .mjs or set "type": "module" in package.json
import fetch from 'node-fetch';
const INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000'); // 5 seconds default
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';
const API_KEY = process.env.PROCESSOR_API_KEY;

if (!API_KEY) {
    console.error('ERROR: PROCESSOR_API_KEY environment variable is not set!');
    process.exit(1);
}

async function getMaxConcurrentProcessors() {
    try {
        const res = await fetch('http://app:9846/api/settings/system-settings');
        if (!res.ok)
            throw new Error('Failed to fetch system settings');
        const settings = await res.json();
        const found = Array.isArray(settings)
            ? settings.find((s) => s.key === 'maxConcurrentProcessors')
            : null;
        const value = found ? parseInt(found.value, 10) : 5;
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
    console.log(`Starting background processor with interval: ${INTERVAL_MS}ms`);
    console.log(`Processor URL: ${PROCESS_URL}`);
    console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
    while (true) {
        try {
            const maxConcurrent = await getMaxConcurrentProcessors();
            console.log('Max concurrent processors:', maxConcurrent);
            const jobs = Array.from({ length: maxConcurrent });
            const results = await Promise.all(jobs.map(() => processJob()));
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
