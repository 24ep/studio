"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { HrisUnifiedTaskInbox } from '@/components/hris/HrisUnifiedTaskInbox';

import { NotificationDrawerHeader } from './notification-drawer-header';
import { ReadNotificationsPanel, UnreadNotificationsPanel } from './notification-drawer-items';
import { NotificationEmptyState, NotificationLoadingState } from './notification-drawer-states';
import { NotificationTabs } from './notification-drawer-tabs';
import type { NotificationDrawerContentProps } from './notification-drawer-types';
import {
  hasNotificationItems,
} from './notification-utils';

export function NotificationDrawerContent({
  activeTab,
  isLoading,
  isMobile,
  markingAllAsRead,
  markingAsRead,
  readNotifications,
  unreadNotifications,
  onClose,
  onMarkAllAsRead,
  onMarkAsRead,
  onTabChange,
}: NotificationDrawerContentProps) {
  const hasNotifications = hasNotificationItems(unreadNotifications, readNotifications);

  return (
    <>
      <NotificationDrawerHeader isMobile={isMobile} onClose={onClose} />
      <ScrollArea className="flex-1 bg-background">
        <div className="px-4 pb-4 pt-2">
          {isLoading ? (
            <NotificationLoadingState />
          ) : !hasNotifications ? (
            <NotificationEmptyState
              title="No notifications"
              description="You're all caught up! New notifications will appear here."
            />
          ) : (
            <div className="w-full">
              <NotificationTabs
                activeTab={activeTab}
                readCount={readNotifications.length}
                unreadCount={unreadNotifications.length}
                onTabChange={onTabChange}
              />
              {activeTab === 'unread' ? (
                <UnreadNotificationsPanel
                  notifications={unreadNotifications}
                  markingAllAsRead={markingAllAsRead}
                  markingAsRead={markingAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onMarkAsRead={onMarkAsRead}
                />
              ) : (
                <ReadNotificationsPanel notifications={readNotifications} />
              )}
            </div>
          )}
          <HrisUnifiedTaskInbox />
        </div>
      </ScrollArea>
    </>
  );
}
