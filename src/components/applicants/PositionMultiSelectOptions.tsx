import { CheckIcon as Check, MagnifyingGlassIcon as Search } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  PositionMultiSelectActions,
  PositionMultiSelectState,
} from "./PositionMultiSelectDropdownTypes";

interface PositionDropdownContentProps {
  actions: PositionMultiSelectActions;
  disabled: boolean;
  selectedIds: Set<string>;
  showOpenStatus: boolean;
  showUnassignedOption: boolean;
  singleSelect: boolean;
  state: Pick<
    PositionMultiSelectState,
    | "allFilteredSelected"
    | "error"
    | "filteredPositions"
    | "searchTerm"
    | "selectedFilteredCount"
  >;
}

export function PositionDropdownContent({
  actions,
  disabled,
  selectedIds,
  showOpenStatus,
  showUnassignedOption,
  singleSelect,
  state,
}: PositionDropdownContentProps) {
  const { allFilteredSelected, error, filteredPositions, searchTerm } = state;

  return (
    <div className="p-2">
      <div className="text-sm font-medium mb-2">Select Positions</div>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search positions..."
          value={searchTerm}
          onChange={(event) => actions.setSearchTerm(event.target.value)}
          className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          disabled={disabled}
        />
      </div>

      {error ? (
        <div className="text-sm text-destructive py-2 px-2">
          Failed to load positions.{" "}
          <button
            type="button"
            className="underline"
            onClick={actions.refreshPositions}
          >
            Retry
          </button>
        </div>
      ) : filteredPositions.length === 0 && !showUnassignedOption ? (
        <div className="text-sm text-muted-foreground py-2">
          No positions available
        </div>
      ) : (
        <div className="space-y-0.5">
          {filteredPositions.length > 0 && !singleSelect && (
            <SelectAllPositionOption
              allFilteredSelected={allFilteredSelected}
              disabled={disabled}
              filteredCount={filteredPositions.length}
              selectedFilteredCount={state.selectedFilteredCount}
              onSelectAll={actions.selectAll}
            />
          )}
          {showUnassignedOption && (
            <PositionOptionButton
              checked={selectedIds.has("not-applied")}
              description="Applicants who haven't applied to any position"
              disabled={disabled}
              label="Not Applied"
              onClick={() => actions.togglePosition("not-applied")}
            />
          )}
          {filteredPositions.map((position) => (
            <PositionOptionButton
              key={position.id}
              checked={selectedIds.has(position.id)}
              description={[position.department, position.positionLevel]
                .filter(Boolean)
                .join(" - ")}
              disabled={disabled}
              label={position.title}
              onClick={() => actions.togglePosition(position.id)}
              trailing={
                showOpenStatus ? (
                  <Badge
                    variant={position.isOpen ? "default" : "secondary"}
                    className="ml-auto text-xs"
                  >
                    {position.isOpen ? "Open" : "Closed"}
                  </Badge>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectAllPositionOption({
  allFilteredSelected,
  disabled,
  filteredCount,
  onSelectAll,
  selectedFilteredCount,
}: {
  allFilteredSelected: boolean;
  disabled: boolean;
  filteredCount: number;
  onSelectAll: () => void;
  selectedFilteredCount: number;
}) {
  return (
    <PositionOptionButton
      checked={allFilteredSelected}
      description={
        allFilteredSelected
          ? "Remove all position filters"
          : `Select all ${filteredCount} positions`
      }
      disabled={disabled}
      label={allFilteredSelected ? "Deselect All" : "Select All"}
      onClick={onSelectAll}
      trailing={
        <Badge variant="outline" className="ml-auto text-xs">
          {selectedFilteredCount}/{filteredCount}
        </Badge>
      }
    />
  );
}

function PositionOptionButton({
  checked,
  description,
  disabled,
  label,
  onClick,
  trailing,
}: {
  checked: boolean;
  description?: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm",
        checked && "bg-accent text-accent-foreground",
      )}
    >
      <div className="flex items-center">
        <Check
          className={cn(
            "mr-2 h-3 w-3",
            checked ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>
        {trailing}
      </div>
    </button>
  );
}
