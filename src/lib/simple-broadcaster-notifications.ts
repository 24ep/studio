import { broadcast as broadcastAll } from "./realtime";

export function broadcastNotification(message: string, type: string = "info", targetUserId?: string) {
  const notification = {
    message,
    level: type,
    timestamp: new Date().toISOString(),
  };

  broadcastAll({ type: "notification", ...notification }, "notification");
}

export function broadcastSystemNotification(message: string, level: string = "info") {
  broadcastAll({
    type: "notification",
    message,
    level,
    source: "system",
    timestamp: new Date().toISOString(),
  }, "notification");
}
