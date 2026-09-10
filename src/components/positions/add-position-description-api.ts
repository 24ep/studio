import { readJsonOrFallback } from '@/lib/response-json';

import { normalizeGeneratedJobDescriptionResponse } from './add-position-modal-utils';

interface GeneratedDescriptionRequest {
  department: string;
  existingDescription: string;
  positionLevel?: string | null;
  title: string;
}

export async function requestGeneratedDescription({
  department,
  existingDescription,
  positionLevel,
  title,
}: GeneratedDescriptionRequest) {
  const response = await fetch('/api/ai/generate-job-description', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      department,
      existingDescription,
      positionLevel: positionLevel || 'Not specified',
      title,
    }),
  });
  const data = normalizeGeneratedJobDescriptionResponse(await readJsonOrFallback<unknown>(response, {}));

  if (!response.ok) {
    if (response.status === 503 && data.error.includes('API Key')) {
      throw new Error('AI features are not configured. Please configure an AI provider and API key in System Settings > AI API Keys.');
    }
    throw new Error(data.error || 'Failed to generate job description');
  }

  if (!data.description) {
    throw new Error('No description generated');
  }

  return data.description;
}
