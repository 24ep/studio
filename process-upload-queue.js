const fetch = require('node-fetch');

const INTERVAL_MS = 5000; // 5 seconds
const PROCESS_URL = 'http://localhost:3000/api/upload-queue/process'; // Update port if needed

async function runProcessorLoop() {
  while (true) {
    try {
      const res = await fetch(PROCESS_URL, { method: 'POST' });
      const data = await res.json();
      if (data && data.message === 'No queued jobs') {
        // No jobs, just wait
      } else {
        console.log('Processed job:', data);
      }
    } catch (err) {
      console.error('Background processor error:', err);
    }
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

runProcessorLoop(); 