import { afterEach, describe, expect, it, vi } from 'vitest';

import { safeAll, safeFetch } from './safe-fetch';

function response(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    ...init,
    headers,
  });
}

describe('safeFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed json for successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ value: 1 })));

    await expect(safeFetch<{ value: number }>('/api/test')).resolves.toEqual({
      ok: true,
      status: 200,
      data: { value: 1 },
      error: null,
    });
  });

  it('normalizes non-ok responses and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ error: 'nope' }, { status: 503 })));

    await expect(safeFetch('/api/test')).resolves.toMatchObject({
      ok: false,
      status: 503,
      data: null,
      error: 'HTTP 503',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')));

    await expect(safeFetch('/api/test')).resolves.toMatchObject({
      ok: false,
      status: null,
      data: null,
      error: 'offline',
    });
  });

  it('normalizes settled batches', async () => {
    const results = await safeAll([
      Promise.resolve({ ok: true, status: 200, data: 'ok', error: null }),
      Promise.reject(new Error('boom')),
    ]);

    expect(results).toEqual([
      { ok: true, status: 200, data: 'ok', error: null },
      { ok: false, status: null, data: null, error: 'Promise rejected' },
    ]);
  });
});
