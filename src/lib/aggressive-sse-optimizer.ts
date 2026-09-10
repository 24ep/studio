// Aggressive SSE Optimizer - Dramatically reduce event frequency
// This implements strict rate limiting and event batching

import {
  addToBatch,
  cleanupEventBatches,
  clearEventBatch,
  flushEventBatches,
  getBatchStats,
  getTotalBatchedEvents
} from './aggressive-sse-batch';
import { BATCH_FLUSH_INTERVAL, CLEANUP_INTERVAL } from './aggressive-sse-config';
import {
  canSendEvent,
  cleanupEventThrottles,
  clearEventThrottles,
  getThrottleStats
} from './aggressive-sse-throttle';
import type { AggressiveBroadcastOptions, BatchedEvent } from './aggressive-sse-types';
import { broadcast } from './realtime';
import type { EventPayload, UnifiedEventType } from './realtime-event-types';

const globalSseOptimizerState = globalThis as unknown as {
  __aggressiveSseFlushInterval?: NodeJS.Timeout;
  __aggressiveSseCleanupInterval?: NodeJS.Timeout;
};

function sendBroadcastEvent(event: BatchedEvent): void {
  if (!event.targetUserId) {
    broadcast({ type: event.type, ...event.data }, event.type);
  }
}

// Start batch flushing
if (!globalSseOptimizerState.__aggressiveSseFlushInterval) {
  globalSseOptimizerState.__aggressiveSseFlushInterval = setInterval(() => {
    flushEventBatches(canSendEvent, sendBroadcastEvent);
  }, BATCH_FLUSH_INTERVAL);
  globalSseOptimizerState.__aggressiveSseFlushInterval.unref?.();
}

// Aggressive broadcast functions
export function aggressiveBroadcast(
  eventType: UnifiedEventType,
  data: EventPayload,
  options: AggressiveBroadcastOptions = {}
): void {
  const {
    targetUserId,
    priority = 'medium',
    throttle = true
  } = options;

  if (throttle && !canSendEvent(eventType)) {
    return;
  }

  addToBatch({
    type: eventType,
    data,
    targetUserId,
    priority,
    timestamp: Date.now()
  });
}

export function broadcastHighPriority(
  eventType: UnifiedEventType,
  data: EventPayload,
  targetUserId?: string
): void {
  aggressiveBroadcast(eventType, data, {
    targetUserId,
    priority: 'high',
    throttle: false
  });
}

export function broadcastMediumPriority(
  eventType: UnifiedEventType,
  data: EventPayload,
  targetUserId?: string
): void {
  aggressiveBroadcast(eventType, data, {
    targetUserId,
    priority: 'medium',
    throttle: true
  });
}

export function broadcastLowPriority(
  eventType: UnifiedEventType,
  data: EventPayload,
  targetUserId?: string
): void {
  aggressiveBroadcast(eventType, data, {
    targetUserId,
    priority: 'low',
    throttle: true
  });
}

export function forceBroadcast(
  eventType: UnifiedEventType,
  data: EventPayload,
  targetUserId?: string
): void {
  if (!targetUserId) {
    broadcast({ type: eventType, ...data }, eventType);
  }
}

export function getOptimizationStats() {
  const now = Date.now();

  return {
    globalThrottles: getThrottleStats(now),
    eventBatches: getBatchStats(),
    totalBatchedEvents: getTotalBatchedEvents()
  };
}

export function emergencyReset(): void {
  console.warn('[AggressiveSSE] EMERGENCY: Resetting all throttles and batches');

  clearEventThrottles();
  clearEventBatch();
}

// Auto-reset throttles and cleanup stale data every 2 minutes
if (!globalSseOptimizerState.__aggressiveSseCleanupInterval) {
  globalSseOptimizerState.__aggressiveSseCleanupInterval = setInterval(() => {
    const now = Date.now();

    cleanupEventThrottles(now);
    cleanupEventBatches(now);
  }, CLEANUP_INTERVAL);
  globalSseOptimizerState.__aggressiveSseCleanupInterval.unref?.();
}
