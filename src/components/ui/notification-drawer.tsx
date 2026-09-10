"use client";

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToastManager } from '@/hooks/use-toast-manager';
import { getNotificationBuckets } from './notification-utils';
import { NotificationDrawerContent } from './notification-drawer-content';
import type { NotificationDrawerProps, NotificationDrawerTab } from './notification-drawer-types';

export function NotificationDrawer({ isOpen, onClose, onNotificationRead }: NotificationDrawerProps) {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { success: showSuccessToast, error: showErrorToast } = useToastManager();
  const [activeTab, setActiveTab] = useState<NotificationDrawerTab>('unread');
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const isMobile = useIsMobile();
  const { unreadNotifications, readNotifications } = getNotificationBuckets(notifications);

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      await markAsRead(notificationId);
      showSuccessToast('Notification marked as read');
      onNotificationRead();
    } catch {
      showErrorToast('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      await markAllAsRead();
      showSuccessToast('All notifications marked as read');
      onNotificationRead();
    } catch {
      showErrorToast('Failed to mark all notifications as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const content = (
    <NotificationDrawerContent
      activeTab={activeTab}
      isLoading={isLoading}
      isMobile={isMobile}
      markingAllAsRead={markingAllAsRead}
      markingAsRead={markingAsRead}
      readNotifications={readNotifications}
      unreadNotifications={unreadNotifications}
      onClose={onClose}
      onMarkAllAsRead={handleMarkAllAsRead}
      onMarkAsRead={handleMarkAsRead}
      onTabChange={setActiveTab}
    />
  );

  // On mobile, use Dialog (modal) instead of Sheet (drawer)
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-[90vh] p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl flex flex-col [&>button]:hidden"
          dialogId="notification-modal"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>Notifications</DialogTitle>
          </VisuallyHidden>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Use Sheet (drawer)
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="!top-4 !right-4 !bottom-4 !left-auto !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] sm:!w-[28rem] max-w-md p-0 flex flex-col overflow-hidden rounded-2xl border border-border/70 shadow-2xl [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}

