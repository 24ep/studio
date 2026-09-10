import type { EventPayload, EventPriority, UnifiedEventType } from './realtime-event-types';

export interface EventThrottle {
  lastSent: number;
  count: number;
  windowStart: number;
}

export interface BatchedEvent {
  type: UnifiedEventType;
  data: EventPayload;
  targetUserId?: string;
  priority: EventPriority;
  timestamp: number;
}

export interface AggressiveBroadcastOptions {
  targetUserId?: string;
  priority?: EventPriority;
  throttle?: boolean;
}
