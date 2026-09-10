const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:8021';
const apiKey = process.env.PROCESSOR_API_KEY || process.env.AUTOMATION_API_KEY || process.env.NEXTAUTH_SECRET;
const intervalMs = Math.max(1000, Number(process.env.SCREENING_PROCESSOR_INTERVAL_MS || 5000));

if (!apiKey) {
  console.error('Screening processor requires PROCESSOR_API_KEY, AUTOMATION_API_KEY, or NEXTAUTH_SECRET.');
  process.exit(1);
}

let stopping = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

async function processOne() {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/screening/process`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Screening processor request failed (${response.status})`);
  return response.json();
}

async function main() {
  console.log(`Screening processor polling ${baseUrl} every ${intervalMs}ms.`);
  while (!stopping) {
    try {
      const result = await processOne();
      if (!result.processedCaseId) await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}

void main();
