"use client";

import { useState, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { NotificationDrawer } from './notification-drawer';
import { FloatingNotification } from './floating-notification';
import { useNotifications } from '@/contexts/NotificationContext';

export function NotificationIcon() {
  const { data: session } = useSession();
  const { unreadCount, isLoading } = useNotifications();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isClickingRef = useRef(false);

  const handleNotificationClick = useCallback(() => {
    // Prevent rapid clicks
    if (isClickingRef.current) {
      return;
    }

    isClickingRef.current = true;
    setIsDrawerOpen(true);

    // Reset click protection after animation
    setTimeout(() => {
      isClickingRef.current = false;
    }, 300);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleFloatingNotificationClick = useCallback(() => {
    // Prevent rapid clicks
    if (isClickingRef.current) {
      return;
    }

    isClickingRef.current = true;
    setIsDrawerOpen(true);

    // Reset click protection after animation
    setTimeout(() => {
      isClickingRef.current = false;
    }, 300);
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNotificationClick}
        className="relative h-9 w-9 rounded-full border-0 bg-transparent text-slate-500 shadow-none transition-colors duration-200 ease-in-out hover:bg-[#f1f3f6] hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        disabled={isLoading || isClickingRef.current}
      >
        <Bell className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:rotate-12" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center unread-notification-pulse bg-destructive text-destructive-foreground shadow-lg transition-all duration-300 ease-in-out hover:scale-110"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onNotificationRead={() => {}} // Handled by context
      />
      
      <FloatingNotification onNavigate={handleFloatingNotificationClick} />
    </>
  );
}
