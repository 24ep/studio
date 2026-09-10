import type {
  NotificationContextItem,
  NotificationInput,
} from './notification-context-utils';

export interface NotificationContextType {
  notifications: NotificationContextItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: NotificationInput) => void;
  clearNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
}
