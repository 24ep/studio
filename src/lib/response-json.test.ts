import { describe, expect, it, vi } from 'vitest';

import { readJsonObject, readJsonOrFallback } from './response-json';

function responseWithJson(json: () => Promise<unknown>) {
  return { json: vi.fn(json) } as unknown as Response;
}

describe('response-json', () => {
  it('returns parsed response JSON', async () => {
    const response = responseWithJson(async () => ({ ok: true }));

    await expect(readJsonObject(response)).resolves.toEqual({ ok: true });
  });

  it('returns the supplied fallback when JSON parsing fails', async () => {
    const response = responseWithJson(async () => {
      throw new Error('invalid json');
    });

    await expect(readJsonOrFallback(response, [])).resolves.toEqual([]);
    await expect(readJsonObject(response)).resolves.toEqual({});
  });

  it('returns an empty object for non-object JSON', async () => {
    await expect(readJsonObject(responseWithJson(async () => ['not-object']))).resolves.toEqual({});
    await expect(readJsonObject(responseWithJson(async () => 'not-object'))).resolves.toEqual({});
  });
});
