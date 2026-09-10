import type React from 'react';
import { useMemo, useState } from 'react';
import {
  ChevronUpDownIcon as ChevronsUpDown,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  StatusDropdownContent,
  StatusTriggerContent,
} from './StatusMultiSelectDropdownParts';
import type { StatusMultiSelectDropdownProps } from './StatusMultiSelectDropdownTypes';
import {
  STATUS_SELECT_ALL_ID,
  filterStatusStages,
  getSelectedStatusStages,
  removeStatusSelection,
  toggleStatusSelection,
} from './status-multi-select-utils';

export function StatusMultiSelectDropdown({
  selectedIds,
  onSelectionChange,
  placeholder = "Select pipeline stages...",
  className,
  disabled = false,
  stages,
  applicantCounts = {},
}: StatusMultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStages = useMemo(
    () => filterStatusStages(stages, searchTerm),
    [stages, searchTerm]
  );
  const selectedStages = useMemo(
    () => getSelectedStatusStages(stages, selectedIds),
    [stages, selectedIds]
  );
  const hasSelectAll = selectedIds.has(STATUS_SELECT_ALL_ID);

  const handleToggleStage = (stageId: string) => {
    onSelectionChange(toggleStatusSelection(selectedIds, stageId));
  };

  const handleRemoveStage = (
    stageId: string,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => {
    event?.stopPropagation();
    onSelectionChange(removeStatusSelection(selectedIds, stageId));
  };

  const handleClearSelection = () => {
    if (!disabled) {
      onSelectionChange(new Set());
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 px-3 py-2"
            disabled={disabled}
          >
            <StatusTriggerContent
              hasSelectAll={hasSelectAll}
              placeholder={placeholder}
              selectedStages={selectedStages}
              onRemoveStage={handleRemoveStage}
              onToggleStage={handleToggleStage}
            />
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          zIndexType="dropdown"
        >
          <StatusDropdownContent
            applicantCounts={applicantCounts}
            disabled={disabled}
            filteredStages={filteredStages}
            hasSelectAll={hasSelectAll}
            searchTerm={searchTerm}
            selectedIds={selectedIds}
            onSearchTermChange={setSearchTerm}
            onToggleStage={handleToggleStage}
          />
        </PopoverContent>
      </Popover>
      {selectedIds.size > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClearSelection}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
