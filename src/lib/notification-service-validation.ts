import { validate as validateUuid } from 'uuid';

export function assertValidNotificationUserId(userId: string) {
  if (!validateUuid(userId)) {
    console.error('Invalid userId UUID in notification service:', userId);
    throw new Error('Invalid user ID format');
  }
}

export function assertValidNotificationActorId(actingUserId?: string) {
  if (actingUserId && !validateUuid(actingUserId)) {
    console.error('Invalid actingUserId UUID in notification service:', actingUserId);
    throw new Error('Invalid acting user ID format');
  }
}

export function isSelfNotification(userId: string, actingUserId?: string) {
  return Boolean(actingUserId && userId === actingUserId);
}
