"use client";

import { forwardRef, type ComponentPropsWithoutRef, type KeyboardEvent, type MouseEvent } from 'react';
import { ChevronUpDownIcon as ChevronsUpDown, XMarkIcon as X } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { RecruiterMultiSelectOption } from './recruiter-multi-select-types';
import {
  SELECT_ALL_RECRUITER_ID,
  UNASSIGNED_RECRUITER_ID,
} from './recruiter-multi-select-utils';

interface RecruiterMultiSelectTriggerProps extends ComponentPropsWithoutRef<typeof Button> {
  disabled: boolean;
  hasSelectAll: boolean;
  hasUnassigned: boolean;
  open: boolean;
  placeholder: string;
  selectedIds: Set<string>;
  selectedRecruiters: RecruiterMultiSelectOption[];
  onRemoveRecruiter: (recruiterId: string, event?: MouseEvent | KeyboardEvent) => void;
  onToggleRecruiter: (recruiterId: string) => void;
}

export const RecruiterMultiSelectTrigger = forwardRef<HTMLButtonElement, RecruiterMultiSelectTriggerProps>(function RecruiterMultiSelectTrigger({
  className,
  disabled,
  hasSelectAll,
  hasUnassigned,
  open,
  placeholder,
  selectedIds,
  selectedRecruiters,
  onRemoveRecruiter,
  onToggleRecruiter,
  ...buttonProps
}, ref) {
  return (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn('w-full min-w-full justify-between min-h-[40px] h-auto py-2', className)}
      disabled={disabled}
      {...buttonProps}
    >
      <div className="flex flex-wrap gap-1 flex-1">
        {hasSelectAll ? (
          <RecruiterSelectionBadge
            label="Select All"
            variant="default"
            onRemove={() => onToggleRecruiter(SELECT_ALL_RECRUITER_ID)}
          />
        ) : selectedIds.size === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <>
            {hasUnassigned && (
              <RecruiterSelectionBadge
                label="Unassigned"
                onRemove={(event) => onRemoveRecruiter(UNASSIGNED_RECRUITER_ID, event)}
              />
            )}
            {selectedRecruiters.map((recruiter) => (
              <RecruiterSelectionBadge
                key={recruiter.id}
                label={recruiter.name}
                onRemove={(event) => onRemoveRecruiter(recruiter.id, event)}
              />
            ))}
          </>
        )}
      </div>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );
});

function RecruiterSelectionBadge({
  label,
  variant = 'secondary',
  onRemove,
}: {
  label: string;
  variant?: 'default' | 'secondary';
  onRemove: (event: MouseEvent | KeyboardEvent) => void;
}) {
  return (
    <Badge variant={variant} className="text-xs">
      {label}
      <button
        type="button"
        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onRemove(event);
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={onRemove}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}
