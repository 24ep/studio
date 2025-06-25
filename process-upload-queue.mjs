// To run as ESM: rename this file to .mjs or set "type": "module" in package.json
import fetch from 'node-fetch';
const INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000'); // 5 seconds default
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';
const API_KEY = process.env.PROCESSOR_API_KEY;

if (!API_KEY) {
    console.error('ERROR: PROCESSOR_API_KEY environment variable is not set!');
    process.exit(1);
}

async function runProcessorLoop() {
    console.log(`Starting background processor with interval: ${INTERVAL_MS}ms`);
    console.log(`Processor URL: ${PROCESS_URL}`);
    console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
    
    while (true) {
        try {
            console.log(`Making request to: ${PROCESS_URL}`);
            const res = await fetch(PROCESS_URL, { 
                method: 'POST', 
                headers: { 
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json'
                } 
            });
            
            console.log(`Response status: ${res.status}`);
            console.log(`Response headers:`, Object.fromEntries(res.headers.entries()));
            
            const text = await res.text();
            console.log(`Response body (first 200 chars):`, text.substring(0, 200));
            
            if (!res.ok) {
                console.error(`HTTP Error: ${res.status} - ${res.statusText}`);
                console.error(`Response body:`, text);
                await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
                continue;
            }
            
            try {
                const data = JSON.parse(text);
                if (data && data.message === 'No queued jobs') {
                    // No jobs, just wait
                    console.log('No queued jobs found, waiting...');
                }
                else {
                    console.log('Processed job:', data);
                }
            } catch (err) {
                console.error('Background processor error: Could not parse JSON. Response was:');
                console.error('HTTP status:', res.status);
                console.error('HTTP headers:', Object.fromEntries(res.headers.entries()));
                console.error('Response text:', text);
                console.error('JSON parse error:', err.message);
            }
        }
        catch (err) {
            console.error('Background processor error:', err.message);
            console.error('Error stack:', err.stack);
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
