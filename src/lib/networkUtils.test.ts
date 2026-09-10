import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  checkApiHealth,
  checkNetworkHealth,
  getErrorMessage,
  handleApiResponse,
  handleApiResponseJson,
  isRetryableError,
  retryWithBackoff,
} from './networkUtils';

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    statusText: init.statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('network utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks network health for healthy and unhealthy responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(null)));
    await expect(checkNetworkHealth('https://example.test')).resolves.toMatchObject({
      isHealthy: true,
      details: {
        dnsResolution: true,
        connectionEstablished: true,
        responseReceived: true,
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(null, {
      status: 503,
      statusText: 'Unavailable',
    })));
    await expect(checkNetworkHealth('https://example.test')).resolves.toMatchObject({
      isHealthy: false,
      error: 'HTTP 503: Unavailable',
      details: {
        dnsResolution: true,
        connectionEstablished: true,
        responseReceived: false,
      },
    });
  });

  it('checks multiple API endpoint health', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ ok: false }, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(checkApiHealth(['/ok', '/bad'])).resolves.toMatchObject({
      isHealthy: false,
      endpoints: {
        '/ok': { status: 'healthy' },
        '/bad': { status: 'unhealthy', error: 'HTTP 500' },
      },
    });
  });

  it('retries with backoff until an operation succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('server down'), { status: 503 }))
      .mockResolvedValueOnce('ok');

    await expect(retryWithBackoff(operation, 2, 0)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry forbidden, unauthorized, or missing responses', async () => {
    const operation = vi.fn().mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));

    await expect(retryWithBackoff(operation, 3, 0)).rejects.toThrow('forbidden');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('maps public error and response helpers', async () => {
    expect(isRetryableError({ status: 502 })).toBe(true);
    expect(getErrorMessage({ status: 404 })).toContain('Resource not found');
    expect(() => handleApiResponse(response({}, { status: 403 }))).toThrow('No permission');

    await expect(handleApiResponseJson<{ value: number }>(response({ value: 1 }))).resolves.toEqual({ value: 1 });
  });
});
