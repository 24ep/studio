import { broadcast as broadcastAll } from "./realtime";
import type { BroadcastBatchEvent, EventPayload, UnifiedEventType } from "./realtime-event-types";

export function broadcast(eventType: UnifiedEventType, data: EventPayload, targetUserId?: string) {
  if (!targetUserId) {
    broadcastAll({ type: eventType, ...data }, eventType);
  }
}

export function broadcastBatch(events: BroadcastBatchEvent[]) {
  events.forEach(event => {
    broadcast(event.type, event.data, event.targetUserId);
  });
}
