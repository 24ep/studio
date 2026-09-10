import type { NotificationDisplayItem } from './notification-utils';

export type NotificationDrawerTab = 'unread' | 'read';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead: () => void;
}

export interface NotificationDrawerContentProps {
  activeTab: NotificationDrawerTab;
  isLoading: boolean;
  isMobile: boolean;
  markingAllAsRead: boolean;
  markingAsRead: string | null;
  readNotifications: NotificationDisplayItem[];
  unreadNotifications: NotificationDisplayItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onTabChange: (tab: NotificationDrawerTab) => void;
}

export interface NotificationTabsProps {
  activeTab: NotificationDrawerTab;
  readCount: number;
  unreadCount: number;
  onTabChange: (tab: NotificationDrawerTab) => void;
}

export interface UnreadNotificationsPanelProps {
  notifications: NotificationDisplayItem[];
  markingAllAsRead: boolean;
  markingAsRead: string | null;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (notificationId: string) => void;
}
