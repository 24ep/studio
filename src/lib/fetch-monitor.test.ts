import { describe, expect, it, vi } from 'vitest';

import { subscribeToFetchMonitor, type FetchMonitorTarget } from './fetch-monitor';

describe('subscribeToFetchMonitor', () => {
  it('shares one wrapper and restores fetch after the final subscriber leaves', async () => {
    const originalFetch = vi.fn(async () => new Response('ok')) as unknown as typeof fetch;
    const target: FetchMonitorTarget = { fetch: originalFetch };
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const unsubscribeFirst = subscribeToFetchMonitor({ onResponse: firstListener }, target);
    const monitoredFetch = target.fetch;
    const unsubscribeSecond = subscribeToFetchMonitor({ onResponse: secondListener }, target);

    expect(target.fetch).toBe(monitoredFetch);
    await target.fetch('/api/test');
    expect(originalFetch).toHaveBeenCalledTimes(1);
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    expect(target.fetch).toBe(monitoredFetch);
    unsubscribeSecond();
    expect(target.fetch).toBe(originalFetch);
  });

  it('notifies error listeners and preserves the original rejection', async () => {
    const failure = new Error('offline');
    const target: FetchMonitorTarget = {
      fetch: vi.fn(async () => { throw failure; }) as unknown as typeof fetch,
    };
    const onError = vi.fn();
    const unsubscribe = subscribeToFetchMonitor({ onError }, target);

    await expect(target.fetch('/api/test')).rejects.toBe(failure);
    expect(onError).toHaveBeenCalledWith(failure, '/api/test', undefined);

    unsubscribe();
  });
});
