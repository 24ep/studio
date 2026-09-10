"use client";

import React from 'react';
import { AlertTriangle, Settings2, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

export class UnifiedRoleDrawerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UnifiedRoleDrawer error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the role drawer. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function UnifiedRoleDrawerTabs({
  activeTab,
  membersCount,
  onTabChange,
}: {
  activeTab: string;
  membersCount: number;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: 'details', label: 'Details', icon: Settings2 },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { id: 'members', label: `Members (${membersCount})`, icon: Users },
  ];

  return (
    <div className="flex w-full border-b border-border/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <div
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              getUnderlineNavTriggerClassName(activeTab === tab.id),
              "px-6 py-3",
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
