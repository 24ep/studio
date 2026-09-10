import { describe, expect, it } from 'vitest';

import {
  getSsePayloadType,
  isMeaningfulSsePayload,
  parseSseJsonData,
} from './sse-event-utils';

describe('sse-event-utils', () => {
  it('parses valid SSE JSON payloads', () => {
    expect(parseSseJsonData('{"type":"Applicant_update","id":"a1"}')).toEqual({
      ok: true,
      data: { type: 'Applicant_update', id: 'a1' },
    });
  });

  it('returns the raw payload for malformed JSON', () => {
    expect(parseSseJsonData('{not json')).toEqual({
      ok: false,
      rawData: '{not json',
    });
  });

  it('extracts and classifies payload types', () => {
    expect(getSsePayloadType({ type: 'dashboard_update' })).toBe('dashboard_update');
    expect(getSsePayloadType({ type: 123 })).toBeUndefined();
    expect(isMeaningfulSsePayload({ type: 'keepalive' })).toBe(false);
    expect(isMeaningfulSsePayload({ type: 'connected' })).toBe(false);
    expect(isMeaningfulSsePayload({ type: 'position_update' })).toBe(true);
    expect(isMeaningfulSsePayload({})).toBe(false);
  });
});
