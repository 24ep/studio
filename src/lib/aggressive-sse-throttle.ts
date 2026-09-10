import { GLOBAL_EVENT_LIMIT, GLOBAL_WINDOW_MS, STALE_THRESHOLD } from './aggressive-sse-config';
import type { EventThrottle } from './aggressive-sse-types';

const eventThrottles = new Map<string, EventThrottle>();

export function canSendEvent(eventType: string): boolean {
  const now = Date.now();
  const throttle = eventThrottles.get(eventType) ?? {
    lastSent: 0,
    count: 0,
    windowStart: now
  };

  if (now - throttle.windowStart >= GLOBAL_WINDOW_MS) {
    throttle.count = 0;
    throttle.windowStart = now;
  }

  if (throttle.count >= GLOBAL_EVENT_LIMIT) {
    return false;
  }

  throttle.count++;
  throttle.lastSent = now;
  eventThrottles.set(eventType, throttle);
  return true;
}

export function getThrottleStats(now: number) {
  return Array.from(eventThrottles.entries()).map(([type, throttle]) => ({
    type,
    count: throttle.count,
    lastSent: throttle.lastSent,
    lastSentAgo: now - throttle.lastSent,
    windowAge: now - throttle.windowStart
  }));
}

export function clearEventThrottles(): void {
  eventThrottles.clear();
}

export function cleanupEventThrottles(now = Date.now()): void {
  for (const [type, throttle] of eventThrottles.entries()) {
    if (now - throttle.lastSent > STALE_THRESHOLD) {
      eventThrottles.delete(type);
      continue;
    }

    if (now - throttle.windowStart >= GLOBAL_WINDOW_MS) {
      throttle.count = 0;
      throttle.windowStart = now;
    }
  }
}
