import type { KeyboardEvent } from 'react';
import { Bell } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import {
  formatTimestamp,
  type RealtimeNotification,
} from './realtime-collaboration-utils';
import { RealtimeSectionHeading } from './realtime-collaboration-section-heading';

export function NotificationsSection({
  notifications,
  unreadCount,
  onNotificationRead,
}: {
  notifications: RealtimeNotification[];
  unreadCount: number;
  onNotificationRead: (notificationId: string) => void;
}) {
  return (
    <div>
      <RealtimeSectionHeading icon={<Bell className="w-4 h-4" />} label="Notifications" count={unreadCount} />
      <ScrollArea className="h-24">
        <div className="space-y-2">
          {notifications.map(notification => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onNotificationRead={onNotificationRead}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function NotificationRow({
  notification,
  onNotificationRead,
}: {
  notification: RealtimeNotification;
  onNotificationRead: (notificationId: string) => void;
}) {
  const markAsRead = () => {
    if (!notification.read) {
      onNotificationRead(notification.id);
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      markAsRead();
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors',
        notification.read ? 'opacity-60' : 'bg-muted/50',
        'hover:bg-muted'
      )}
      onClick={markAsRead}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="mt-1">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">
          {notification.title}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {notification.message}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTimestamp(notification.timestamp)}
        </div>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-blue-500 rounded-md mt-1" />
      )}
    </div>
  );
}
