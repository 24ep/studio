import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addToBatch,
  cleanupEventBatches,
  clearEventBatch,
  flushEventBatches,
  getBatchStats,
  getTotalBatchedEvents
} from './aggressive-sse-batch';
import { GLOBAL_EVENT_LIMIT, GLOBAL_WINDOW_MS, STALE_THRESHOLD } from './aggressive-sse-config';
import {
  canSendEvent,
  cleanupEventThrottles,
  clearEventThrottles,
  getThrottleStats
} from './aggressive-sse-throttle';
import type { BatchedEvent } from './aggressive-sse-types';

const BASE_TIME = new Date('2026-06-01T00:00:00.000Z');

function buildEvent(overrides: Partial<BatchedEvent> = {}): BatchedEvent {
  return {
    type: 'position_update',
    data: { id: 'position-1' },
    priority: 'medium',
    timestamp: Date.now(),
    ...overrides
  };
}

describe('aggressive SSE optimizer internals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    clearEventBatch();
    clearEventThrottles();
  });

  afterEach(() => {
    clearEventBatch();
    clearEventThrottles();
    vi.useRealTimers();
  });

  it('deduplicates batched events and keeps the highest priority', () => {
    addToBatch(buildEvent({ priority: 'low' }));
    addToBatch(buildEvent({ priority: 'high' }));

    expect(getBatchStats()).toEqual([
      {
        key: 'position_update_global',
        count: 1,
        priorities: { high: 1 }
      }
    ]);
  });

  it('flushes events only after their priority delay has elapsed', () => {
    const sentEvents: BatchedEvent[] = [];

    addToBatch(buildEvent({ priority: 'medium' }));
    flushEventBatches(() => true, (event) => sentEvents.push(event));

    expect(sentEvents).toHaveLength(0);
    expect(getTotalBatchedEvents()).toBe(1);

    vi.advanceTimersByTime(200);
    flushEventBatches(() => true, (event) => sentEvents.push(event));

    expect(sentEvents).toHaveLength(1);
    expect(getTotalBatchedEvents()).toBe(0);
  });

  it('caps batch size and removes stale batches', () => {
    for (let index = 0; index < 35; index++) {
      addToBatch(buildEvent({
        data: { id: `position-${index}` },
        priority: 'low'
      }));
    }

    expect(getTotalBatchedEvents()).toBe(30);

    addToBatch(buildEvent({
      type: 'Applicant_update',
      timestamp: Date.now() - STALE_THRESHOLD - 1
    }));
    cleanupEventBatches(Date.now());

    expect(getBatchStats()).toEqual([
      {
        key: 'position_update_global',
        count: 30,
        priorities: { low: 30 }
      }
    ]);
  });

  it('enforces throttle limits and resets elapsed windows', () => {
    for (let index = 0; index < GLOBAL_EVENT_LIMIT; index++) {
      expect(canSendEvent('position_update')).toBe(true);
    }

    expect(canSendEvent('position_update')).toBe(false);
    expect(getThrottleStats(Date.now())[0].count).toBe(GLOBAL_EVENT_LIMIT);

    vi.advanceTimersByTime(GLOBAL_WINDOW_MS);
    expect(canSendEvent('position_update')).toBe(true);
    expect(getThrottleStats(Date.now())[0].count).toBe(1);
  });

  it('removes stale throttle entries during cleanup', () => {
    expect(canSendEvent('position_update')).toBe(true);

    cleanupEventThrottles(Date.now() + STALE_THRESHOLD + 1);

    expect(getThrottleStats(Date.now())).toEqual([]);
  });
});
