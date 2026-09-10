import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, X } from "lucide-react";
import { useLocalization } from '@/contexts/LocalizationContext';

export interface BoardFieldOption {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface CustomizeBoardMultiSelectTriggerProps {
  open: boolean;
  placeholder?: string;
  selected: string[];
  validOptions: BoardFieldOption[];
  onRemove: (value: string) => void;
  onToggle: () => void;
}

export function CustomizeBoardMultiSelectTrigger({
  open,
  placeholder,
  selected,
  validOptions,
  onRemove,
  onToggle,
}: CustomizeBoardMultiSelectTriggerProps) {
  const { t } = useLocalization();

  return (
    <div
      className={cn(
        "flex min-h-[44px] cursor-pointer flex-wrap items-center gap-1 rounded-lg border bg-background px-3 py-2 transition-all duration-200",
        "hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        open && "border-primary/50 ring-2 ring-primary/20",
      )}
      onClick={onToggle}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      {selected.length === 0 && (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          {placeholder || t("tasks.customizeBoard.selectValuesToShow", "Select values to show...")}
        </span>
      )}
      {selected.map((value) => {
        const option = validOptions.find((item) => item.key === value);

        return (
          <Badge
            key={value}
            variant="secondary"
            className="border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
          >
            {option ? option.label : value}
            <button
              type="button"
              className="ml-1 text-primary/60 transition-colors hover:text-primary"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(value);
              }}
              aria-label={t("tasks.customizeBoard.removeValue", "Remove {value}").replace("{value}", value)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
    </div>
  );
}

interface CustomizeBoardMultiSelectDropdownProps {
  filteredOptions: BoardFieldOption[];
  maxHeight: string;
  searchTerm: string;
  selected: string[];
  validOptions: BoardFieldOption[];
  onSearchChange: (value: string) => void;
  onSelect: (value: string) => void;
  onSelectAll: () => void;
}

export function CustomizeBoardMultiSelectDropdown({
  filteredOptions,
  maxHeight,
  searchTerm,
  selected,
  validOptions,
  onSearchChange,
  onSelect,
  onSelectAll,
}: CustomizeBoardMultiSelectDropdownProps) {
  const { t } = useLocalization();

  return (
    <div className="absolute mt-1 w-full rounded-lg border bg-popover shadow-lg">
      <div className="border-b p-2">
        <input
          type="text"
          placeholder={t("tasks.customizeBoard.searchValues", "Search values...")}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      {filteredOptions.length > 0 && (
        <div className="border-b p-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectAll();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-primary transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={selected.length === filteredOptions.length && filteredOptions.length > 0}
              className="h-4 w-4"
            />
            <span className="font-medium">
              {selected.length === filteredOptions.length
                ? t("tasks.customizeBoard.deselectAll", "Deselect All")
                : t("tasks.customizeBoard.selectAll", "Select All")}
            </span>
          </button>
        </div>
      )}

      {filteredOptions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {validOptions.length === 0
            ? t("tasks.customizeBoard.noValuesAvailable", "No values available")
            : t("tasks.customizeBoard.noValuesFound", "No values found")}
        </div>
      ) : (
        <div style={{ maxHeight, minHeight: 100, overflowY: "auto" }}>
          <div className="p-1">
            {filteredOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(option.key);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selected.includes(option.key)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                <Checkbox checked={selected.includes(option.key)} className="h-4 w-4" />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomizeBoardMultiSelectBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
}
