'use client';

import type React from 'react';
import { Activity, BarChart3, History, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

export type WebhookManagementTab = 'overview' | 'webhooks' | 'analytics' | 'logs';

const WEBHOOK_TABS = [
  { id: 'overview', label: 'Overview', Icon: BarChart3 },
  { id: 'webhooks', label: 'Webhooks', Icon: Zap },
  { id: 'analytics', label: 'Analytics', Icon: Activity },
  { id: 'logs', label: 'Logs', Icon: History },
] satisfies Array<{
  id: WebhookManagementTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}>;

interface WebhookNavigationTabsProps {
  activeTab: WebhookManagementTab;
  onTabChange: (tab: WebhookManagementTab) => void;
}

export function WebhookNavigationTabs({
  activeTab,
  onTabChange,
}: WebhookNavigationTabsProps) {
  return (
    <div className="flex w-full border-b border-border/50 mb-6">
      {WEBHOOK_TABS.map(({ id, label, Icon }) => (
        <div
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            getUnderlineNavTriggerClassName(activeTab === id),
            'px-6 py-3',
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onTabChange(id);
            }
          }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </div>
      ))}
    </div>
  );
}
