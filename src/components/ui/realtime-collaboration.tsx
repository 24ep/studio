"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';
import { readJsonOrFallback } from '@/lib/response-json';
import { cn } from '@/lib/utils';
import {
  RealtimeCollapsedButton,
  RealtimeCollaborationHeader,
  RealtimeCollaborationSections,
} from './realtime-collaboration-parts';
import {
  normalizeRealtimeNotifications,
  type CollaborationEvent,
  type OnlineUser,
  type RealtimeNotification,
} from './realtime-collaboration-utils';

interface RealtimeCollaborationProps {
  className?: string;
  showOnlineUsers?: boolean;
  showCollaborationEvents?: boolean;
  showNotifications?: boolean;
  maxItems?: number;
}

export function RealtimeCollaboration({
  className,
  showOnlineUsers = true,
  showCollaborationEvents = true,
  showNotifications = true,
  maxItems = 10,
}: RealtimeCollaborationProps) {
  const { data: session } = useSession();
  const onlineUsers: OnlineUser[] = [];
  const collaborationEvents: CollaborationEvent[] = [];
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/realtime/notifications');
        if (response.ok) {
          setNotifications(normalizeRealtimeNotifications(await readJsonOrFallback<unknown>(response, [])));
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.warn('RealtimeCollaboration: Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [session?.user?.id]);

  useEnhancedSSE();

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id || !notificationId) return;
    try {
      await fetch(`/api/realtime/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.warn('RealtimeCollaboration: Error marking notification as read:', error);
    }
  }, [session?.user?.id]);

  if (!isVisible) {
    return <RealtimeCollapsedButton className={className} onShow={() => setIsVisible(true)} />;
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-80", className)}>
      <Card className="shadow-lg">
        <RealtimeCollaborationHeader lastUpdate={lastUpdate} onHide={() => setIsVisible(false)} />
        <RealtimeCollaborationSections
          onlineUsers={onlineUsers.slice(0, maxItems)}
          collaborationEvents={collaborationEvents.slice(0, maxItems)}
          notifications={notifications.slice(0, maxItems)}
          showOnlineUsers={showOnlineUsers}
          showCollaborationEvents={showCollaborationEvents}
          showNotifications={showNotifications}
          onNotificationRead={(notificationId) => {
            void markNotificationAsRead(notificationId);
          }}
        />
      </Card>
    </div>
  );
}
