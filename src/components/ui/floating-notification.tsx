"use client";

import { useState, useEffect, type KeyboardEvent } from 'react';
import { X, Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  formatNotificationBadgeCount,
  formatNotificationRelativeTime,
  getLatestUnreadNotification,
  isNotificationActivationKey,
  type NotificationDisplayItem,
} from './notification-utils';

interface FloatingNotificationProps {
  onNavigate?: () => void;
}

export function FloatingNotification({ onNavigate }: FloatingNotificationProps) {
  const { notifications, unreadCount } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [latestNotification, setLatestNotification] = useState<NotificationDisplayItem | null>(null);

  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0) {
      const latest = getLatestUnreadNotification(notifications);
      if (latest && latest !== latestNotification) {
        setLatestNotification(latest);
        setIsVisible(true);
        
        // Auto-hide after 8 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 8000);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [notifications, unreadCount, latestNotification]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
    setIsVisible(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isNotificationActivationKey(event.key)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  if (!isVisible || !latestNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm w-80 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">New Notification</span>
            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center unread-notification-pulse">
              {formatNotificationBadgeCount(unreadCount)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss notification"
            onClick={handleClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div 
          className="cursor-pointer group"
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <h4 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
            {latestNotification.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {latestNotification.message}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatNotificationRelativeTime(latestNotification.createdAt)}
            </span>
            <div className="flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
              <span>View</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
