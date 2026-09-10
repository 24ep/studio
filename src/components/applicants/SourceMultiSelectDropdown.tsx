"use client";

import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ApplicantSource } from '@/lib/types';
import {
  SourceMultiSelectClearButton,
  SourceMultiSelectContent,
  SourceMultiSelectTrigger,
} from './SourceMultiSelectDropdownParts';
import { useSourceMultiSelectDropdown } from './use-source-multi-select-dropdown';

interface SourceMultiSelectDropdownProps {
  selectedSourceIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  availableSources: ApplicantSource[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SourceMultiSelectDropdown({
  selectedSourceIds,
  onSelectionChange,
  availableSources,
  placeholder = "Select sources...",
  className,
  disabled = false,
}: SourceMultiSelectDropdownProps) {
  const sourceSelect = useSourceMultiSelectDropdown({
    availableSources,
    onSelectionChange,
    selectedSourceIds,
  });

  return (
    <div className={cn("relative", className)}>
      <Popover open={sourceSelect.open} onOpenChange={sourceSelect.setOpen}>
        <SourceMultiSelectTrigger
          disabled={disabled}
          isSelectAllSelected={sourceSelect.isSelectAllSelected}
          isUnassignedSelected={sourceSelect.isUnassignedSelected}
          open={sourceSelect.open}
          placeholder={placeholder}
          selectedSources={sourceSelect.selectedSources}
          handleRemove={sourceSelect.handleRemove}
        />
        <SourceMultiSelectContent
          disabled={disabled}
          filteredSources={sourceSelect.filteredSources}
          isSelectAllSelected={sourceSelect.isSelectAllSelected}
          isUnassignedSelected={sourceSelect.isUnassignedSelected}
          safeAvailableSources={sourceSelect.safeAvailableSources}
          safeSelectedSourceIds={sourceSelect.safeSelectedSourceIds}
          searchQuery={sourceSelect.searchQuery}
          handleSelect={sourceSelect.handleSelect}
          setSearchQuery={sourceSelect.setSearchQuery}
        />
      </Popover>
      <SourceMultiSelectClearButton
        selectedSources={sourceSelect.selectedSources}
        handleClearAll={sourceSelect.handleClearAll}
      />
    </div>
  );
}
