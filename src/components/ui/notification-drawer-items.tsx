"use client";

import type { KeyboardEvent } from 'react';
import { Bell, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { UnreadNotificationsPanelProps } from './notification-drawer-types';
import { NotificationEmptyState } from './notification-drawer-states';
import {
  formatNotificationRelativeTime,
  getNotificationAnimationDelay,
  isNotificationActivationKey,
  type NotificationDisplayItem,
} from './notification-utils';

export function UnreadNotificationsPanel({
  notifications,
  markingAllAsRead,
  markingAsRead,
  onMarkAllAsRead,
  onMarkAsRead,
}: UnreadNotificationsPanelProps) {
  if (notifications.length === 0) {
    return (
      <NotificationEmptyState
        title="No unread notifications"
        description="You're all caught up!"
      />
    );
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAllAsRead}
          className="mr-2 text-xs"
          disabled={markingAllAsRead}
        >
          {markingAllAsRead ? <div className="mr-1 h-4 w-4 animate-spin" /> : 'Mark all read'}
        </Button>
      </div>
      {notifications.map((notification, index) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          index={index}
          isUnread
          markingAsRead={markingAsRead}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </>
  );
}

export function ReadNotificationsPanel({ notifications }: { notifications: NotificationDisplayItem[] }) {
  if (notifications.length === 0) {
    return (
      <NotificationEmptyState
        title="No read notifications"
        description="Read notifications will appear here."
      />
    );
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          index={index}
          isUnread={false}
        />
      ))}
    </>
  );
}

function NotificationRow({
  notification,
  index,
  isUnread,
  markingAsRead,
  onMarkAsRead,
}: {
  notification: NotificationDisplayItem;
  index: number;
  isUnread: boolean;
  markingAsRead?: string | null;
  onMarkAsRead?: (notificationId: string) => void;
}) {
  const activateNotification = () => {
    if (!isUnread || !onMarkAsRead || markingAsRead === notification.id) return;
    onMarkAsRead(notification.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isNotificationActivationKey(event.key)) return;
    event.preventDefault();
    activateNotification();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}${isUnread ? ', unread' : ''}`}
      onClick={activateNotification}
      onKeyDown={handleKeyDown}
      className={cn(
        'notification-item mb-2 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isUnread
          ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 dark:bg-blue-950/25 dark:hover:bg-blue-950/40 dark:border-blue-900/70'
          : 'bg-card opacity-60 border-border'
      )}
      style={{ animationDelay: getNotificationAnimationDelay(index) }}
    >
      <div className="mt-1 flex-shrink-0">
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight text-foreground">
            {notification.title}
          </h4>
          {isUnread && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary unread-notification-pulse" />}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {notification.message}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatNotificationRelativeTime(notification.createdAt)}
          </span>
          {isUnread && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="ml-2 h-6 px-3 text-xs hover:bg-primary/10"
              disabled={markingAsRead === notification.id}
            >
              {markingAsRead === notification.id ? (
                <div className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-1 h-3 w-3" />
              )}
              Mark read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
