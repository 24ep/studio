"use client";

import { useCallback, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';

import { useToastManager } from '@/hooks/use-toast-manager';

import {
  countUnreadNotifications,
  createLocalNotification,
  sanitizeNotifications,
  type NotificationContextItem,
  type NotificationInput,
} from './notification-context-utils';
import type { NotificationContextType } from './NotificationContextTypes';

function isFrontendNotificationId(notificationId: string) {
  return /^\d{13,}$/.test(notificationId);
}

function markNotificationRead(
  notifications: NotificationContextItem[],
  notificationId: string
) {
  return notifications.map(notification =>
    notification.id === notificationId ? { ...notification, isRead: true } : notification
  );
}

function getNotificationApiErrorMessage(status: number, errorData: unknown) {
  if (
    errorData &&
    typeof errorData === 'object' &&
    'error' in errorData &&
    typeof errorData.error === 'string'
  ) {
    return `API error: ${status} - ${errorData.error}`;
  }

  return `API error: ${status} - Unknown error`;
}

function isTransientFetchError(error: unknown) {
  return (
    (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message))
    || (error instanceof DOMException && error.name === 'AbortError')
  );
}

export function useNotificationContextState(hasSessionUser: boolean): NotificationContextType {
  const { success: showToast } = useToastManager({ deduplicationWindowMs: 2000 });
  const [notifications, setNotifications] = useState<NotificationContextItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!hasSessionUser) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/realtime/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        const sanitizedNotifications = sanitizeNotifications(data);
        setNotifications(sanitizedNotifications);
        setUnreadCount(countUnreadNotifications(sanitizedNotifications));
      }
    } catch (error) {
      // Navigation, iframe reloads, and dev-server recompiles can interrupt this
      // background request. Notifications are best-effort, so do not promote an
      // expected transport interruption into Next.js' development error overlay.
      if (!isTransientFetchError(error)) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasSessionUser]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (isFrontendNotificationId(notificationId)) {
      setNotifications(previous => markNotificationRead(previous, notificationId));
      setUnreadCount(previous => Math.max(0, previous - 1));
      return;
    }

    try {
      const response = await fetch(`/api/realtime/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getNotificationApiErrorMessage(response.status, errorData));
      }

      setNotifications(previous => markNotificationRead(previous, notificationId));
      setUnreadCount(previous => Math.max(0, previous - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(previous => previous.map(notification => ({ ...notification, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const addNotification = useCallback((notification: NotificationInput) => {
    const newNotification = createLocalNotification(notification);

    setNotifications(previous => [newNotification, ...previous]);
    setUnreadCount(previous => previous + 1);

    if (notificationsEnabled) {
      showToast(`${notification.title}: ${notification.message}`, {
        duration: 5000,
        icon: <Bell className="h-4 w-4" />,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      });
    }
  }, [notificationsEnabled, showToast]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotifications,
    setNotificationsEnabled,
    notificationsEnabled,
  }), [
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotifications,
    notificationsEnabled,
  ]);
}
