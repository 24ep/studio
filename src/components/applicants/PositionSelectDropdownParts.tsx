import { CheckIcon as Check, ChevronUpDownIcon as ChevronsUpDown, MagnifyingGlassIcon as Search } from "@heroicons/react/24/outline";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Position } from "@/lib/types";
import { getPositionSelectDescription } from "./position-select-dropdown-utils";

interface PositionSelectTriggerProps extends ComponentPropsWithoutRef<typeof Button> {
  disabled: boolean;
  loading: boolean;
  open: boolean;
  placeholder: string;
  selectedPosition?: Position;
  showOpenStatus: boolean;
}

interface PositionSelectContentProps {
  filteredPositions: Position[];
  searchTerm: string;
  showNoneOption: boolean;
  showOpenStatus: boolean;
  value?: string;
  onSearchTermChange: (value: string) => void;
  onSelect: (value: string) => void;
}

export const PositionSelectTrigger = forwardRef<HTMLButtonElement, PositionSelectTriggerProps>(function PositionSelectTrigger({
  className,
  disabled,
  loading,
  open,
  placeholder,
  selectedPosition,
  showOpenStatus,
  ...buttonProps
}, ref) {
  return (
    <Button
      ref={ref}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground [&>*]:!text-foreground", className)}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {loading ? (
        <span className="text-foreground">Loading positions...</span>
      ) : selectedPosition ? (
        <div className="flex items-center gap-2">
          <span className="truncate text-foreground">{selectedPosition.title}</span>
          <PositionOpenStatusBadge position={selectedPosition} showOpenStatus={showOpenStatus} />
        </div>
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-foreground" />
    </Button>
  );
});

export function PositionSelectContent({
  filteredPositions,
  searchTerm,
  showNoneOption,
  showOpenStatus,
  value,
  onSearchTermChange,
  onSelect,
}: PositionSelectContentProps) {
  return (
    <div className="bg-popover text-popover-foreground">
      <div className="flex items-center border-b border-border px-3 bg-popover">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
        <Input
          placeholder="Search positions..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground focus-visible:ring-0"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {filteredPositions.length === 0 && !showNoneOption ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No position found.
          </div>
        ) : (
          <div className="p-1">
            {showNoneOption && (
              <PositionSelectOption
                checked={value === ""}
                description="No specific position assigned"
                label="None (General Application)"
                onSelect={() => onSelect("")}
              />
            )}
            {filteredPositions.map((position) => (
              <PositionSelectOption
                key={position.id}
                checked={value === position.id}
                description={getPositionSelectDescription(position)}
                label={position.title}
                onSelect={() => onSelect(position.id)}
                trailing={<PositionOpenStatusBadge position={position} showOpenStatus={showOpenStatus} />}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PositionSelectFallbackInput({
  className,
  disabled,
  value,
  onValueChange,
}: {
  className?: string;
  disabled: boolean;
  value?: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Enter position title (API unavailable)"
        value={value || ''}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
        className={className}
      />
    </div>
  );
}

function PositionSelectOption({
  checked,
  description,
  label,
  onSelect,
  trailing,
}: {
  checked: boolean;
  description: string;
  label: string;
  onSelect: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-foreground"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <Check className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
      {trailing}
    </div>
  );
}

function PositionOpenStatusBadge({
  position,
  showOpenStatus,
}: {
  position: Position;
  showOpenStatus: boolean;
}) {
  if (!showOpenStatus) {
    return null;
  }

  return (
    <Badge
      variant={position.isOpen ? "default" : "secondary"}
      className="ml-auto text-xs"
    >
      {position.isOpen ? "Open" : "Closed"}
    </Badge>
  );
}
