"use client";

import { Loader2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { PositionStatusFilter } from './position-page-utils';
import { PositionsMobileFilterRadioRow } from './PositionsMobileFilterRadioRow';

const STATUS_OPTIONS: Array<{ value: PositionStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export function PositionsMobileSearchFilter({
  searchTerm,
  onSearchChange,
  onClearSearch,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search positions..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className="pl-10 pr-10"
        autoComplete="off"
        spellCheck="false"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClearSearch}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function PositionsMobileStatusFilter({
  statusFilter,
  onStatusChange,
}: {
  statusFilter: PositionStatusFilter;
  onStatusChange: (status: PositionStatusFilter) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block" id="status-filter-label">Status</label>
      <div
        className="flex flex-col border rounded-md overflow-hidden"
        role="radiogroup"
        aria-labelledby="status-filter-label"
      >
        {STATUS_OPTIONS.map((status, index) => (
          <PositionsMobileFilterRadioRow
            key={status.value}
            label={status.label}
            selected={(statusFilter || 'all') === status.value}
            withBorder={index !== STATUS_OPTIONS.length - 1}
            onSelect={() => onStatusChange(status.value)}
          />
        ))}
      </div>
    </div>
  );
}

export function PositionsMobileDepartmentFilter({
  allDepartments,
  departmentFilter,
  isLoadingDepartments,
  onDepartmentChange,
  onRetryDepartments,
}: {
  allDepartments: string[];
  departmentFilter: string;
  isLoadingDepartments: boolean;
  onDepartmentChange: (department: string) => void;
  onRetryDepartments: () => void;
}) {
  if (isLoadingDepartments) {
    return (
      <div className="w-full px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md border border-dashed flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </div>
    );
  }

  if (allDepartments.length === 0) {
    return (
      <div className="w-full px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md border border-dashed">
        <div className="flex items-center gap-2">
          <span>No departments</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 text-xs"
            onClick={onRetryDepartments}
            title="Retry loading departments"
          >
            <Loader2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-2 block" id="dept-filter-label">Department</label>
      <div
        className="flex flex-col border rounded-md overflow-hidden max-h-[300px] overflow-y-auto"
        role="radiogroup"
        aria-labelledby="dept-filter-label"
      >
        <PositionsMobileFilterRadioRow
          label="All Departments"
          selected={(departmentFilter || 'all') === 'all'}
          withBorder
          onSelect={() => onDepartmentChange('all')}
        />
        {allDepartments.map((department, index) => (
          <PositionsMobileFilterRadioRow
            key={department}
            label={department}
            selected={departmentFilter === department}
            withBorder={index !== allDepartments.length - 1}
            onSelect={() => onDepartmentChange(department)}
          />
        ))}
      </div>
    </div>
  );
}
