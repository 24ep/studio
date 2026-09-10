"use client";

import { FilterX, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LogLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

import { ApplicationLogsDateFilter } from './ApplicationLogsDateFilter';
import {
  ApplicationLogsLevelFilter,
  ApplicationLogsSearchField,
  ApplicationLogsUserFilter,
} from './ApplicationLogsFilterControls';
import type { LogUserOption } from './application-logs-page-types';

interface ApplicationLogsFiltersPanelProps {
  isLoading: boolean;
  levelFilter: LogLevel | 'ALL';
  searchQuery: string;
  actingUserIdFilter: string;
  startDate?: Date;
  endDate?: Date;
  allUsers: LogUserOption[];
  filteredUsersForDropdown: LogUserOption[];
  userSearch: string;
  userPopoverOpen: boolean;
  onSearchQueryChange: (value: string) => void;
  onLevelFilterChange: (value: LogLevel | 'ALL') => void;
  onActingUserIdFilterChange: (value: string) => void;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  onUserSearchChange: (value: string) => void;
  onUserPopoverOpenChange: (open: boolean) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export function ApplicationLogsFiltersPanel({
  isLoading,
  levelFilter,
  searchQuery,
  actingUserIdFilter,
  startDate,
  endDate,
  allUsers,
  filteredUsersForDropdown,
  userSearch,
  userPopoverOpen,
  onSearchQueryChange,
  onLevelFilterChange,
  onActingUserIdFilterChange,
  onStartDateChange,
  onEndDateChange,
  onUserSearchChange,
  onUserPopoverOpenChange,
  onApplyFilters,
  onResetFilters,
}: ApplicationLogsFiltersPanelProps) {
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 10;
  const toYear = currentYear + 1;

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ApplicationLogsSearchField
          value={searchQuery}
          onChange={onSearchQueryChange}
          onApply={onApplyFilters}
        />
        <ApplicationLogsLevelFilter value={levelFilter} onChange={onLevelFilterChange} />
        <ApplicationLogsUserFilter
          actingUserIdFilter={actingUserIdFilter}
          allUsers={allUsers}
          filteredUsersForDropdown={filteredUsersForDropdown}
          userSearch={userSearch}
          userPopoverOpen={userPopoverOpen}
          onActingUserIdFilterChange={onActingUserIdFilterChange}
          onUserSearchChange={onUserSearchChange}
          onUserPopoverOpenChange={onUserPopoverOpenChange}
        />
        <ApplicationLogsDateFilter
          id="start-date"
          label="Start Date"
          date={startDate}
          fromYear={fromYear}
          toYear={toYear}
          onDateChange={onStartDateChange}
        />
        <ApplicationLogsDateFilter
          id="end-date"
          label="End Date"
          date={endDate}
          fromYear={fromYear}
          toYear={toYear}
          onDateChange={onEndDateChange}
        />
        <ApplicationLogsFilterActions
          isLoading={isLoading}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
        />
      </div>
    </div>
  );
}

function ApplicationLogsFilterActions({
  isLoading,
  onApplyFilters,
  onResetFilters,
}: {
  isLoading: boolean;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <Button variant="outline" onClick={onResetFilters} disabled={isLoading} className="w-full">
        <FilterX className="mr-2 h-4 w-4" />
        Reset
      </Button>
      <Button onClick={onApplyFilters} disabled={isLoading} className="w-full">
        <Search className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
        Apply
      </Button>
    </div>
  );
}
