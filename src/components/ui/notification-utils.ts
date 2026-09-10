import { formatDistanceToNow, isValid } from 'date-fns';

export interface NotificationDisplayItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
}

export function getNotificationBuckets(notifications: unknown) {
  if (!Array.isArray(notifications)) {
    return { unreadNotifications: [], readNotifications: [] };
  }

  return notifications.reduce<{
    unreadNotifications: NotificationDisplayItem[];
    readNotifications: NotificationDisplayItem[];
  }>(
    (buckets, notification) => {
      if (!isNotificationDisplayItem(notification)) return buckets;

      if (notification.isRead) {
        buckets.readNotifications.push(notification);
      } else {
        buckets.unreadNotifications.push(notification);
      }

      return buckets;
    },
    { unreadNotifications: [], readNotifications: [] }
  );
}

export function isNotificationDisplayItem(value: unknown): value is NotificationDisplayItem {
  if (!value || typeof value !== 'object') return false;

  const notification = value as Partial<NotificationDisplayItem>;
  return (
    typeof notification.id === 'string' &&
    typeof notification.title === 'string' &&
    typeof notification.message === 'string' &&
    typeof notification.isRead === 'boolean' &&
    (typeof notification.createdAt === 'string' || notification.createdAt instanceof Date)
  );
}

export function getLatestUnreadNotification(notifications: unknown) {
  return getNotificationBuckets(notifications).unreadNotifications[0] ?? null;
}

export function formatNotificationRelativeTime(createdAt: string | Date) {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (!isValid(date)) return 'Unknown time';

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatNotificationBadgeCount(count: number) {
  return count > 99 ? '99+' : count;
}

export function getNotificationAnimationDelay(index: number) {
  return `${(index * 0.05).toFixed(2)}s`;
}

export function hasNotificationItems(
  unreadNotifications: NotificationDisplayItem[],
  readNotifications: NotificationDisplayItem[]
) {
  return unreadNotifications.length + readNotifications.length > 0;
}

export function isNotificationActivationKey(key: string) {
  return key === 'Enter' || key === ' ';
}
