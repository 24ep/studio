"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';

import type { NotificationContextType } from './NotificationContextTypes';
import { useNotificationContextState } from './use-notification-context-state';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const notificationState = useNotificationContextState(Boolean(session?.user));
  const { fetchNotifications } = notificationState;

  const hasAuthenticatedUser = Boolean(session?.user);
  useEnhancedSSE(hasAuthenticatedUser);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && hasAuthenticatedUser) {
      fetchNotifications();
    }
  }, [fetchNotifications, hasAuthenticatedUser, isClient]);

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
