import { MAX_BATCH_SIZE, PRIORITY_DELAYS, STALE_THRESHOLD } from './aggressive-sse-config';
import type { BatchedEvent } from './aggressive-sse-types';
import type { EventPriority } from './realtime-event-types';

const eventBatch = new Map<string, BatchedEvent[]>();

function getBatchKey(event: BatchedEvent): string {
  return `${event.type}_${event.targetUserId ?? 'global'}`;
}

function getHigherPriority(currentPriority: EventPriority, nextPriority: EventPriority): EventPriority {
  if (nextPriority === 'high' || currentPriority === 'high') {
    return 'high';
  }

  if (nextPriority === 'medium' || currentPriority === 'medium') {
    return 'medium';
  }

  return 'low';
}

function isDuplicateEvent(event: BatchedEvent, nextEvent: BatchedEvent): boolean {
  return event.type === nextEvent.type && JSON.stringify(event.data) === JSON.stringify(nextEvent.data);
}

export function addToBatch(event: BatchedEvent): void {
  const batchKey = getBatchKey(event);
  const batch = eventBatch.get(batchKey) ?? [];
  const existingIndex = batch.findIndex((existingEvent) => isDuplicateEvent(existingEvent, event));

  if (existingIndex >= 0) {
    const existingEvent = batch[existingIndex];
    batch[existingIndex] = {
      ...event,
      priority: getHigherPriority(existingEvent.priority, event.priority)
    };
  } else {
    batch.push(event);
  }

  if (batch.length > MAX_BATCH_SIZE) {
    batch.splice(0, batch.length - MAX_BATCH_SIZE);
  }

  eventBatch.set(batchKey, batch);
}

export function flushEventBatches(
  canSendEvent: (eventType: string) => boolean,
  sendEvent: (event: BatchedEvent) => void
): void {
  const now = Date.now();

  for (const [batchKey, events] of eventBatch.entries()) {
    if (events.length === 0) {
      continue;
    }

    events.sort((event, nextEvent) => {
      if (event.priority !== nextEvent.priority) {
        return PRIORITY_DELAYS[event.priority] - PRIORITY_DELAYS[nextEvent.priority];
      }

      return event.timestamp - nextEvent.timestamp;
    });

    const eventsToSend = events.filter((event) => now - event.timestamp >= PRIORITY_DELAYS[event.priority]);

    if (eventsToSend.length === 0) {
      continue;
    }

    for (const event of eventsToSend) {
      if (canSendEvent(event.type)) {
        sendEvent(event);
      }
    }

    eventBatch.set(
      batchKey,
      events.filter((event) => !eventsToSend.includes(event))
    );
  }
}

export function getBatchStats() {
  return Array.from(eventBatch.entries()).map(([key, events]) => ({
    key,
    count: events.length,
    priorities: events.reduce((acc, event) => {
      acc[event.priority] = (acc[event.priority] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }));
}

export function getTotalBatchedEvents(): number {
  return Array.from(eventBatch.values()).reduce((sum, batch) => sum + batch.length, 0);
}

export function clearEventBatch(): void {
  eventBatch.clear();
}

export function cleanupEventBatches(now = Date.now()): void {
  for (const [key, events] of eventBatch.entries()) {
    if (events.length === 0) {
      eventBatch.delete(key);
      continue;
    }

    const oldestEvent = events[0];
    if (oldestEvent && now - oldestEvent.timestamp > STALE_THRESHOLD) {
      eventBatch.delete(key);
    }
  }
}
