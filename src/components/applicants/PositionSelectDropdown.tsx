"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PositionSelectContent,
  PositionSelectFallbackInput,
  PositionSelectTrigger,
} from "./PositionSelectDropdownParts";
import { usePositionSelectDropdown } from "./use-position-select-dropdown";

interface PositionSelectDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showOpenStatus?: boolean;
  filterOpenOnly?: boolean;
  showNoneOption?: boolean;
}

export function PositionSelectDropdown({
  value,
  onValueChange,
  placeholder = "Select position...",
  disabled = false,
  className,
  showOpenStatus = true,
  filterOpenOnly = false,
  showNoneOption = false,
}: PositionSelectDropdownProps) {
  const dropdown = usePositionSelectDropdown({ filterOpenOnly, value });

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    dropdown.setOpen(false);
  };

  if (dropdown.error) {
    return (
      <PositionSelectFallbackInput
        className={className}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
      />
    );
  }

  return (
    <Popover open={dropdown.open} onOpenChange={dropdown.setOpen}>
      <PopoverTrigger asChild>
        <PositionSelectTrigger
          className={className}
          disabled={disabled}
          loading={dropdown.loading}
          open={dropdown.open}
          placeholder={placeholder}
          selectedPosition={dropdown.selectedPosition}
          showOpenStatus={showOpenStatus}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border" align="start" zIndexType="dropdown">
        <PositionSelectContent
          filteredPositions={dropdown.filteredPositions}
          searchTerm={dropdown.searchTerm}
          showNoneOption={showNoneOption}
          showOpenStatus={showOpenStatus}
          value={value}
          onSearchTermChange={dropdown.setSearchTerm}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
