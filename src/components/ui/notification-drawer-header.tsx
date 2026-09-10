"use client";

import { Bell, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationDrawerHeader({
  isMobile,
  onClose,
}: {
  isMobile: boolean;
  onClose: () => void;
}) {
  return (
    <div className={cn(
      '!flex !flex-row !items-center !justify-between gap-4 border-b bg-card px-6 py-5 !text-left !space-y-0 rounded-t-2xl',
      isMobile && 'px-5'
    )}>
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-foreground" />
        <h2 className={cn('text-lg font-semibold text-foreground', isMobile && 'text-base')}>
          Notifications
        </h2>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Close notifications"
        onClick={onClose}
        className="mr-1 h-9 w-9 shrink-0 rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
