import { Eye, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CollaborationEventsSection } from './realtime-collaboration-activity';
import { NotificationsSection } from './realtime-collaboration-notifications-section';
import { OnlineUsersSection } from './realtime-collaboration-online-users';
import {
  formatTimestamp,
  type CollaborationEvent,
  type OnlineUser,
  type RealtimeNotification,
} from './realtime-collaboration-utils';

export function RealtimeCollapsedButton({
  className,
  onShow,
}: {
  className?: string;
  onShow: () => void;
}) {
  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onShow}
        className="rounded-md w-12 h-12 p-0"
      >
        <Eye className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function RealtimeCollaborationHeader({
  lastUpdate,
  onHide,
}: {
  lastUpdate: Date;
  onHide: () => void;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">Real-time Collaboration</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHide}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Last updated: {formatTimestamp(lastUpdate.getTime())}
      </div>
    </CardHeader>
  );
}

export function RealtimeCollaborationSections({
  onlineUsers,
  collaborationEvents,
  notifications,
  showOnlineUsers,
  showCollaborationEvents,
  showNotifications,
  onNotificationRead,
}: {
  onlineUsers: OnlineUser[];
  collaborationEvents: CollaborationEvent[];
  notifications: RealtimeNotification[];
  showOnlineUsers: boolean;
  showCollaborationEvents: boolean;
  showNotifications: boolean;
  onNotificationRead: (notificationId: string) => void;
}) {
  const unreadNotificationCount = notifications.filter(notification => !notification.read).length;

  return (
    <CardContent className="space-y-4">
      {showOnlineUsers && <OnlineUsersSection users={onlineUsers} />}
      {showCollaborationEvents && <CollaborationEventsSection events={collaborationEvents} />}
      {showNotifications && (
        <NotificationsSection
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          onNotificationRead={onNotificationRead}
        />
      )}
    </CardContent>
  );
}
