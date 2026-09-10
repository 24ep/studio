import { describe, expect, it, vi } from 'vitest';

import { fetchSystemSettings, saveSystemSettings } from './system-settings-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('system settings API helpers', () => {
  it('loads system settings and normalizes legacy array responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({
      settings: [{ key: 'pwaEnabled', value: 'true' }],
    }));

    await expect(fetchSystemSettings(fetcher)).resolves.toEqual({ pwaEnabled: 'true' });
    expect(fetcher).toHaveBeenCalledWith('/api/settings/system-settings');
  });

  it('surfaces load errors from the API response', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ message: 'No permission' }, false));

    await expect(fetchSystemSettings(fetcher)).rejects.toThrow('No permission');
  });

  it('saves settings as JSON with an abort signal', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ ok: true }));
    const payload = [{ key: 'pwaEnabled', value: 'true' }];

    await expect(saveSystemSettings(payload, { fetcher })).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith('/api/settings/system-settings', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: expect.any(AbortSignal),
    }));
  });

  it('surfaces save errors and logs validation details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetcher = vi.fn().mockResolvedValue(response({
      message: 'Invalid settings',
      errors: { key: ['required'] },
      data: [{ key: '' }],
    }, false));

    await expect(saveSystemSettings([], { fetcher })).rejects.toThrow('Invalid settings');
    expect(consoleError).toHaveBeenCalledWith('Validation errors:', { key: ['required'] });
    expect(consoleError).toHaveBeenCalledWith('Data that failed validation:', [{ key: '' }]);
    consoleError.mockRestore();
  });
});
