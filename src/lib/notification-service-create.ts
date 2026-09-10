import {
  assertValidNotificationActorId,
  assertValidNotificationUserId,
  isSelfNotification,
} from './notification-service-validation';
import type { NotificationData } from './notification-service-types';

interface CreateNotificationInput<NotificationRecord> {
  actingUserId?: string;
  broadcastNotification: (message: string, type: string, userId: string) => void;
  createNotificationRecord: (input: {
    userId: string;
    notification: NotificationData;
  }) => Promise<NotificationRecord>;
  logAudit: (
    level: 'AUDIT',
    message: string,
    source: string,
    actingUserId: string | undefined,
    details: Record<string, unknown>
  ) => Promise<unknown>;
  notification: NotificationData;
  userId: string;
}

export async function createNotificationWithAudit<NotificationRecord extends {
  message: string;
  type: string;
}>({
  actingUserId,
  broadcastNotification,
  createNotificationRecord,
  logAudit,
  notification,
  userId,
}: CreateNotificationInput<NotificationRecord>) {
  assertValidNotificationUserId(userId);
  assertValidNotificationActorId(actingUserId);

  if (isSelfNotification(userId, actingUserId)) {
    await logAudit('AUDIT', `Self-notification prevented for user ${userId}`, 'NotificationService:Create', actingUserId, {
      targetUserId: userId,
      notificationType: notification.type,
      title: notification.title,
    });
    return null;
  }

  const newNotification = await createNotificationRecord({ userId, notification });
  broadcastNotification(newNotification.message, newNotification.type, userId);

  if (actingUserId) {
    await logAudit('AUDIT', `Notification '${notification.title}' created for user ${userId}`, 'NotificationService:Create', actingUserId, {
      targetUserId: userId,
      notificationType: notification.type,
      title: notification.title,
    });
  }

  return newNotification;
}
