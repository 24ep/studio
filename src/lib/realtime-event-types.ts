export type UnifiedEventType = string;
export type EventPayload = Record<string, unknown>;
export type EventPriority = 'high' | 'medium' | 'low';

export type TrackedRecord = EventPayload;
export type TrackedItem = {
  id?: unknown;
  status?: unknown;
  updated_at?: unknown;
};

export interface BroadcastBatchEvent {
  type: UnifiedEventType;
  data: EventPayload;
  targetUserId?: string;
}
