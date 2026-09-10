"use client";

import {
  ChevronUpDownIcon as ChevronsUpDown,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PositionDropdownContent,
  PositionTriggerContent,
} from "./PositionMultiSelectDropdownParts";
import type { PositionMultiSelectDropdownProps } from "./PositionMultiSelectDropdownTypes";
import { usePositionMultiSelectDropdown } from "./use-position-multi-select-dropdown";

export function PositionMultiSelectDropdown({
  selectedIds,
  onSelectionChange,
  placeholder = "Select positions...",
  disabled = false,
  className,
  showOpenStatus = true,
  filterOpenOnly = false,
  singleSelect = false,
  showUnassignedOption = false,
}: PositionMultiSelectDropdownProps) {
  const state = usePositionMultiSelectDropdown({
    disabled,
    filterOpenOnly,
    onSelectionChange,
    selectedIds,
    singleSelect,
  });

  return (
    <div className={cn("relative", className)}>
      <Popover open={state.open} onOpenChange={state.setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={state.open}
            className="w-full min-w-full justify-between min-h-[40px] h-auto py-2"
            disabled={disabled || state.loading}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              <PositionTriggerContent
                actions={state.actions}
                error={state.error}
                hasNotApplied={state.hasNotApplied}
                loading={state.loading}
                placeholder={placeholder}
                selectedIds={selectedIds}
                selectedPositions={state.selectedPositions}
              />
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[450px] p-0 bg-popover border-border shadow-lg max-h-[300px] overflow-y-auto"
          align="start"
          popoverId="position-multi-select-dropdown"
          zIndexType="dropdown"
        >
          <PositionDropdownContent
            actions={state.actions}
            disabled={disabled}
            selectedIds={selectedIds}
            showOpenStatus={showOpenStatus}
            showUnassignedOption={showUnassignedOption}
            singleSelect={singleSelect}
            state={state}
          />
        </PopoverContent>
      </Popover>
      {selectedIds.size > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={state.actions.clearSelection}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
