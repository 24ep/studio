import React, { useState } from 'react';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { RecruiterMultiSelectOptions } from './RecruiterMultiSelectOptions';
import { RecruiterMultiSelectTrigger } from './RecruiterMultiSelectTrigger';
import type { RecruiterMultiSelectDropdownProps } from './recruiter-multi-select-types';
import {
  filterRecruitersBySearch,
  getSelectedRecruiters,
  removeRecruiterSelection,
  SELECT_ALL_RECRUITER_ID,
  toggleRecruiterSelection,
  UNASSIGNED_RECRUITER_ID,
} from './recruiter-multi-select-utils';

export function RecruiterMultiSelectDropdown({
  selectedIds,
  onSelectionChange,
  placeholder = 'Select recruiters...',
  className,
  disabled = false,
  recruiters,
}: RecruiterMultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredRecruiters = filterRecruitersBySearch(recruiters, searchTerm);
  const selectedRecruiters = getSelectedRecruiters(recruiters, selectedIds);
  const hasUnassigned = selectedIds.has(UNASSIGNED_RECRUITER_ID);
  const hasSelectAll = selectedIds.has(SELECT_ALL_RECRUITER_ID);

  const handleToggleRecruiter = (recruiterId: string) => {
    onSelectionChange(toggleRecruiterSelection(selectedIds, recruiterId));
  };

  const handleRemoveRecruiter = (recruiterId: string, event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.stopPropagation();
    onSelectionChange(removeRecruiterSelection(selectedIds, recruiterId));
  };

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <RecruiterMultiSelectTrigger
            disabled={disabled}
            hasSelectAll={hasSelectAll}
            hasUnassigned={hasUnassigned}
            open={open}
            placeholder={placeholder}
            selectedIds={selectedIds}
            selectedRecruiters={selectedRecruiters}
            onRemoveRecruiter={handleRemoveRecruiter}
            onToggleRecruiter={handleToggleRecruiter}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border shadow-lg max-h-[300px] overflow-y-auto"
          align="start"
          zIndexType="dropdown"
        >
          <RecruiterMultiSelectOptions
            disabled={disabled}
            filteredRecruiters={filteredRecruiters}
            hasSelectAll={hasSelectAll}
            hasUnassigned={hasUnassigned}
            searchTerm={searchTerm}
            selectedIds={selectedIds}
            onSearchTermChange={setSearchTerm}
            onToggleRecruiter={handleToggleRecruiter}
          />
        </PopoverContent>
      </Popover>
      {selectedIds.size > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (disabled) return;
            onSelectionChange(new Set());
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
