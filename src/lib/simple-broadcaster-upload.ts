import { broadcast as broadcastAll } from "./realtime";
import type { EventPayload } from "./realtime-event-types";

function broadcastUploadQueueAction(data: EventPayload) {
  broadcastAll({
    type: "upload_queue_update",
    ...data,
    timestamp: new Date().toISOString(),
  }, "upload_queue_update");
}

export function broadcastUploadStarted(fileName: string, userId: string) {
  broadcastUploadQueueAction({
    action: "started",
    fileName,
    userId,
  });
}

export function broadcastUploadCompleted(fileName: string, userId: string, result: EventPayload) {
  broadcastUploadQueueAction({
    action: "completed",
    fileName,
    result,
    userId,
  });
}

export function broadcastUploadFailed(fileName: string, userId: string, error: string) {
  broadcastUploadQueueAction({
    action: "failed",
    fileName,
    error,
    userId,
  });
}
