import { describe, expect, it } from 'vitest';
import {
  PENDING_COUNT_POLL_INTERVAL_MS,
  buildPendingCount,
  buildPendingCountNoPermissionState,
  buildPendingCountStateFromHealthPayload,
  parsePendingCountSsePayload,
  shouldOpenPendingCountEventSource,
} from './pending-count-utils';

describe('pending-count-utils', () => {
  it('builds pending counts from queued and in-process values', () => {
    expect(buildPendingCount(2, 3)).toBe(5);
    expect(buildPendingCount('4', '5')).toBe(9);
    expect(buildPendingCount(undefined, null)).toBe(0);
  });

  it('normalizes health payloads into permitted pending count state', () => {
    expect(buildPendingCountStateFromHealthPayload({
      queue_stats: { queued: '7', inprocess: 2 },
    })).toEqual({
      pendingCount: 9,
      hasPermission: true,
    });

    expect(buildPendingCountStateFromHealthPayload({})).toEqual({
      pendingCount: 0,
      hasPermission: true,
    });
  });

  it('builds no-permission state for failed health requests', () => {
    expect(buildPendingCountNoPermissionState()).toEqual({
      pendingCount: null,
      hasPermission: false,
    });
  });

  it('opens SSE unless permission has explicitly failed', () => {
    expect(shouldOpenPendingCountEventSource(null)).toBe(true);
    expect(shouldOpenPendingCountEventSource(true)).toBe(true);
    expect(shouldOpenPendingCountEventSource(false)).toBe(false);
  });

  it('parses queue update SSE payloads into pending counts', () => {
    expect(parsePendingCountSsePayload(JSON.stringify({
      type: 'upload_queue_update',
      summary: { queued: 1, inprocess: '2' },
    }))).toBe(3);
    expect(parsePendingCountSsePayload(JSON.stringify({
      type: 'queue',
      summary: { queued: 4 },
    }))).toBe(4);
  });

  it('ignores unrelated and malformed SSE payloads', () => {
    expect(parsePendingCountSsePayload(JSON.stringify({ type: 'other', summary: { queued: 1 } }))).toBeNull();
    expect(parsePendingCountSsePayload(JSON.stringify({ type: 'queue' }))).toBeNull();
    expect(parsePendingCountSsePayload('{bad json')).toBeNull();
  });

  it('uses a stable polling interval', () => {
    expect(PENDING_COUNT_POLL_INTERVAL_MS).toBe(30000);
  });
});
