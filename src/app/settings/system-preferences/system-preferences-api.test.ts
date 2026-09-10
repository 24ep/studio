import { describe, expect, it, vi } from 'vitest';

import { fetchSystemPreferences, saveSystemPreferences } from './system-preferences-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('system preferences API helpers', () => {
  it('loads system preferences with an optional abort signal', async () => {
    const signal = new AbortController().signal;
    const fetcher = vi.fn().mockResolvedValue(response({ appName: 'Studio' }));

    await expect(fetchSystemPreferences({ signal, fetcher })).resolves.toEqual({ appName: 'Studio' });
    expect(fetcher).toHaveBeenCalledWith('/api/settings/system-settings', { signal });
  });

  it('saves system preferences form data', async () => {
    const formData = new FormData();
    const fetcher = vi.fn().mockResolvedValue(response({ ok: true }));

    await expect(saveSystemPreferences(formData, fetcher)).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith('/api/settings/system-settings', {
      method: 'POST',
      body: formData,
    });
  });

  it('throws contextual load and save errors', async () => {
    await expect(fetchSystemPreferences({ fetcher: vi.fn().mockResolvedValue(response({}, false)) }))
      .rejects.toThrow('Failed to load system preferences');
    await expect(saveSystemPreferences(new FormData(), vi.fn().mockResolvedValue(response({}, false))))
      .rejects.toThrow('Failed to save preferences');
  });
});
