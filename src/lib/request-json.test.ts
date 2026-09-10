import { describe, expect, it, vi } from 'vitest';

import { readRequestJsonObject, readRequestJsonOrFallback } from './request-json';

function requestWithJson(json: () => Promise<unknown>) {
  return { json: vi.fn(json) } as unknown as Request;
}

describe('request-json', () => {
  it('returns parsed request JSON', async () => {
    const request = requestWithJson(async () => ({ ok: true }));

    await expect(readRequestJsonObject(request)).resolves.toEqual({ ok: true });
  });

  it('returns the supplied fallback when JSON parsing fails', async () => {
    const request = requestWithJson(async () => {
      throw new Error('invalid json');
    });

    await expect(readRequestJsonOrFallback(request, [])).resolves.toEqual([]);
    await expect(readRequestJsonObject(request)).resolves.toEqual({});
  });

  it('returns an empty object for non-object JSON', async () => {
    await expect(readRequestJsonObject(requestWithJson(async () => ['not-object']))).resolves.toEqual({});
    await expect(readRequestJsonObject(requestWithJson(async () => 'not-object'))).resolves.toEqual({});
  });
});
