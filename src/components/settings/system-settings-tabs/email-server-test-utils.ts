import { readJsonOrFallback } from '../../../lib/response-json';

import type { EmailConnectionSettings, TestEmailResponse } from './email-server-tab-types';

export async function testEmailConnection(settings: EmailConnectionSettings): Promise<TestEmailResponse> {
  const response = await fetch('/api/settings/test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  return readJsonOrFallback<TestEmailResponse>(response, {});
}
