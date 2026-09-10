export function getProcessorApiKey(): string | null {
  return process.env.PROCESSOR_API_KEY
    || process.env.AUTOMATION_API_KEY
    || process.env.NEXTAUTH_SECRET
    || null;
}

export function isValidProcessorApiKey(apiKey: string | null): boolean {
  const configuredKey = getProcessorApiKey();
  return Boolean(configuredKey && apiKey === configuredKey);
}
