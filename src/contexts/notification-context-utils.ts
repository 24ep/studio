export interface NotificationContextItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationInput = Omit<NotificationContextItem, 'id' | 'createdAt' | 'isRead'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getFirstRecord(...values: unknown[]) {
  return values.find(isRecord) ?? {};
}

export function sanitizeNotification(value: unknown): NotificationContextItem | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id),
    type: getString(value.type),
    title: getString(value.title),
    message: getString(value.message),
    data: getRecord(value.data),
    isRead: Boolean(value.isRead),
    createdAt: getString(value.createdAt, new Date().toISOString()),
  };
}

export function sanitizeNotifications(data: unknown) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(sanitizeNotification)
    .filter((notification): notification is NotificationContextItem => notification !== null);
}

export function countUnreadNotifications(notifications: NotificationContextItem[]) {
  return notifications.filter(notification => !notification.isRead).length;
}

export function createLocalNotification(
  notification: NotificationInput,
  now = new Date(),
  id = now.getTime().toString()
): NotificationContextItem {
  return {
    ...notification,
    id,
    createdAt: now.toISOString(),
    isRead: false,
  };
}

export function buildNotificationFromRealtimeEvent(
  data: unknown,
  currentUserId: string | null | undefined
): NotificationInput | null {
  const event = getRecord(data);
  if (event.type !== 'new_notification') {
    return null;
  }

  const targetUserId = getString(event.targetUserId);
  if (targetUserId && targetUserId !== currentUserId) {
    return null;
  }

  const notification = getRecord(event.notification);
  const notificationData = getRecord(notification.data);
  if (notificationData.actingUserId && notificationData.actingUserId === currentUserId) {
    return null;
  }

  const type = getString(notification.type);
  const title = getString(notification.title);
  const message = getString(notification.message);
  if (!type || !title || !message) {
    return null;
  }

  return {
    type,
    title,
    message,
    data: notificationData,
  };
}

export function buildApplicantUpdateNotification(
  data: unknown,
  currentUserId: string | null | undefined
): NotificationInput | null {
  const event = getRecord(data);
  if (event.type !== 'Applicant_update') {
    return null;
  }

  if (event.actingUserId && event.actingUserId === currentUserId) {
    return null;
  }

  const applicant = getFirstRecord(event.applicant, event.Applicant);
  if (Object.keys(applicant).length === 0) {
    return null;
  }

  const displayName = getString(applicant.name) || getString(applicant.email) || 'Unknown applicant';

  return {
    type: 'Applicant_update',
    title: 'Applicant Updated',
    message: `Applicant ${displayName} has been updated`,
    data: {
      ...event,
      applicantId: getString(applicant.id),
    },
  };
}

export function buildPositionUpdateNotification(
  data: unknown,
  currentUserId: string | null | undefined
): NotificationInput | null {
  const event = getRecord(data);
  if (event.type !== 'position_update') {
    return null;
  }

  if (event.actingUserId && event.actingUserId === currentUserId) {
    return null;
  }

  const position = getRecord(event.position);
  if (Object.keys(position).length === 0) {
    return null;
  }

  return {
    type: 'position_update',
    title: 'Position Updated',
    message: `Position "${getString(position.title, 'Untitled position')}" has been updated`,
    data: {
      ...event,
      positionId: getString(position.id),
    },
  };
}
