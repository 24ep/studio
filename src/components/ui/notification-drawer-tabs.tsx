"use client";

import type { ReactNode } from 'react';
import { Bell, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

import type { NotificationDrawerTab, NotificationTabsProps } from './notification-drawer-types';
import { formatNotificationBadgeCount } from './notification-utils';

export function NotificationTabs({
  activeTab,
  readCount,
  unreadCount,
  onTabChange,
}: NotificationTabsProps) {
  return (
    <div className="mb-2 flex w-full border-b border-border/50">
      <NotificationTabButton
        active={activeTab === 'unread'}
        count={unreadCount}
        icon={<Bell className="h-4 w-4" />}
        label="Unread"
        tab="unread"
        variant="destructive"
        onTabChange={onTabChange}
      />
      <NotificationTabButton
        active={activeTab === 'read'}
        count={readCount}
        icon={<Check className="h-4 w-4" />}
        label="Read"
        tab="read"
        variant="secondary"
        onTabChange={onTabChange}
      />
    </div>
  );
}

function NotificationTabButton({
  active,
  count,
  icon,
  label,
  tab,
  variant,
  onTabChange,
}: {
  active: boolean;
  count: number;
  icon: ReactNode;
  label: string;
  tab: NotificationDrawerTab;
  variant: 'destructive' | 'secondary';
  onTabChange: (tab: NotificationDrawerTab) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTabChange(tab)}
      className={cn(
        getUnderlineNavTriggerClassName(active),
        'px-4 py-2',
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <Badge variant={variant} className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs">
          {formatNotificationBadgeCount(count)}
        </Badge>
      )}
    </button>
  );
}
