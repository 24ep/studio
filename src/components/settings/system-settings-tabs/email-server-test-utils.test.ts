import { afterEach, describe, expect, it, vi } from 'vitest';

import { testEmailConnection } from './email-server-test-utils';

describe('email server test utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts SMTP settings to the email test endpoint', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(
      new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));

    vi.stubGlobal('fetch', fetchMock);

    const settings = {
      host: 'smtp.example.com',
      port: 587,
      secure: true,
      user: 'user@example.com',
      password: 'secret',
      fromAddress: 'noreply@example.com',
      fromName: 'Example HR',
      targetEmail: 'admin@example.com'
    };

    await expect(testEmailConnection(settings)).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/settings/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  });
});
