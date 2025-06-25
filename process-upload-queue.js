import fetch from 'node-fetch';
const INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000'); // 5 seconds default
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';
async function runProcessorLoop() {
    console.log(`Starting background processor with interval: ${INTERVAL_MS}ms`);
    console.log(`Processor URL: ${PROCESS_URL}`);
    while (true) {
        try {
            const res = await fetch(PROCESS_URL, { method: 'POST' });
            if (!res.ok) {
                console.error(`HTTP error! status: ${res.status}`);
                continue;
            }
            const data = await res.json();
            if (data && data.message === 'No queued jobs') {
                // No jobs, just wait
                console.log('No queued jobs found, waiting...');
            }
            else {
                console.log('Processed job:', data);
            }
        }
        catch (err) {
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
