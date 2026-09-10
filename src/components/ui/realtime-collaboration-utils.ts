export type OnlineUser = {
  userId: string;
  userName: string;
  userRole: string;
  currentPage: string;
  lastActivity: number | string | Date;
};

export type CollaborationEvent = {
  id: string;
  type: string;
  userName?: string;
  timestamp: number | string | Date;
};

export type RealtimeNotification = Record<string, unknown> & {
  id: string;
  title: string;
  message: string;
  timestamp: number | string | Date;
  read: boolean;
};

export function normalizeRealtimeNotification(value: unknown): RealtimeNotification | null {
  if (!isRecord(value) || !value.id) {
    return null;
  }

  return {
    ...value,
    id: String(value.id),
    title: typeof value.title === 'string' && value.title ? value.title : 'Untitled Notification',
    message: typeof value.message === 'string' && value.message ? value.message : 'No message',
    timestamp: getNotificationTimestamp(value),
    read: typeof value.read === 'boolean' ? value.read : false,
  };
}

export function normalizeRealtimeNotifications(value: unknown): RealtimeNotification[] {
  if (!Array.isArray(value)) {
    console.warn('RealtimeCollaboration: notificationsData is not an array:', value);
    return [];
  }

  return value
    .map(normalizeRealtimeNotification)
    .filter((notification): notification is RealtimeNotification => notification !== null);
}

export function formatTimestamp(timestamp: number | string | Date | null | undefined) {
  if (!timestamp) return 'Unknown time';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function getUserInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getNotificationTimestamp(value: Record<string, unknown>) {
  if (isDateLike(value.timestamp)) {
    return value.timestamp;
  }
  if (isDateLike(value.createdAt)) {
    return value.createdAt;
  }
  return Date.now();
}

function isDateLike(value: unknown): value is number | string | Date {
  return value instanceof Date || typeof value === 'string' || typeof value === 'number';
}
