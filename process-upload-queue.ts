import fetch from 'node-fetch';

const INTERVAL_MS = 5000; // 5 seconds
const PROCESS_URL = 'http://app:9846/api/upload-queue/process'; // Use Docker service name

interface ProcessResponse {
  message?: string;
  [key: string]: any;
}

async function runProcessorLoop(): Promise<never> {
  while (true) {
    try {
      const res = await fetch(PROCESS_URL, { method: 'POST' });
      
      if (!res.ok) {
        console.error(`HTTP error! status: ${res.status}`);
        continue;
      }
      
      const data = await res.json() as ProcessResponse;
      
      if (data && data.message === 'No queued jobs') {
        // No jobs, just wait
        console.log('No queued jobs found, waiting...');
      } else {
        console.log('Processed job:', data);
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