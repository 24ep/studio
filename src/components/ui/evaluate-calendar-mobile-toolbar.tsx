"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ListBulletIcon as List,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';

export function MobileCalendarToolbar({
  currentMonth,
  isCollapsed,
  onListView,
  onPreviousMonth,
  onNextMonth,
  onToggleCollapsed,
}: {
  currentMonth: Date;
  isCollapsed: boolean;
  onListView: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <Button variant="outline" size="sm" onClick={onListView} className="flex items-center gap-1">
        <List className="h-4 w-4" />
        List
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Previous month" className="h-8 w-8" onClick={onPreviousMonth}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[120px] text-center">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="ghost" size="icon" aria-label="Next month" className="h-8 w-8" onClick={onNextMonth}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapsed}>
        {isCollapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
