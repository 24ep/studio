import type React from 'react';
import {
  CheckIcon as Check,
  XMarkIcon as X,
  MagnifyingGlassIcon as Search,
} from '@heroicons/react/24/outline';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecruitmentStage } from "@/lib/types";
import {
  STATUS_SELECT_ALL_ID,
  getApplicantCountBadgeValue,
} from './status-multi-select-utils';

type RemoveStageEvent = React.MouseEvent | React.KeyboardEvent;

interface StatusSelectionBadgeProps {
  label: string;
  variant: 'default' | 'secondary';
  onRemove: (event: RemoveStageEvent) => void;
}

function StatusSelectionBadge({ label, variant, onRemove }: StatusSelectionBadgeProps) {
  return (
    <Badge variant={variant} className="text-xs">
      {label}
      <button
        type="button"
        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onRemove(event);
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(event);
        }}
      >
        <X className="h-2 w-2" />
      </button>
    </Badge>
  );
}

interface StatusTriggerContentProps {
  hasSelectAll: boolean;
  placeholder: string;
  selectedStages: RecruitmentStage[];
  onRemoveStage: (stageId: string, event?: RemoveStageEvent) => void;
  onToggleStage: (stageId: string) => void;
}

export function StatusTriggerContent({
  hasSelectAll,
  placeholder,
  selectedStages,
  onRemoveStage,
  onToggleStage,
}: StatusTriggerContentProps) {
  if (hasSelectAll) {
    return (
      <div className="flex flex-wrap gap-1 flex-1">
        <StatusSelectionBadge
          label="Select All"
          variant="default"
          onRemove={() => onToggleStage(STATUS_SELECT_ALL_ID)}
        />
      </div>
    );
  }

  if (selectedStages.length > 0) {
    return (
      <div className="flex flex-wrap gap-1 flex-1">
        {selectedStages.map((stage) => (
          <StatusSelectionBadge
            key={stage.id}
            label={stage.name}
            variant="secondary"
            onRemove={(event) => onRemoveStage(stage.id, event)}
          />
        ))}
      </div>
    );
  }

  return <span className="text-muted-foreground">{placeholder}</span>;
}

interface StatusSearchInputProps {
  disabled: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

function StatusSearchInput({
  disabled,
  searchTerm,
  onSearchTermChange,
}: StatusSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search pipeline stages..."
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        disabled={disabled}
      />
    </div>
  );
}

interface StatusOptionButtonProps {
  badgeLabel?: string;
  badgeVariant?: 'default' | 'outline';
  checked: boolean;
  description?: string | null;
  label: string;
  onClick: () => void;
}

function StatusOptionButton({
  badgeLabel,
  badgeVariant = 'outline',
  checked,
  description,
  label,
  onClick,
}: StatusOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm",
        checked && "bg-accent text-accent-foreground"
      )}
    >
      <div className="flex items-center">
        <Check
          className={cn(
            "mr-2 h-3 w-3",
            checked ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
        {badgeLabel && (
          <Badge variant={badgeVariant} className="ml-auto text-xs">
            {badgeLabel}
          </Badge>
        )}
      </div>
    </button>
  );
}

interface StatusDropdownContentProps {
  applicantCounts: Record<string, number>;
  disabled: boolean;
  filteredStages: RecruitmentStage[];
  hasSelectAll: boolean;
  searchTerm: string;
  selectedIds: Set<string>;
  onSearchTermChange: (value: string) => void;
  onToggleStage: (stageId: string) => void;
}

export function StatusDropdownContent({
  applicantCounts,
  disabled,
  filteredStages,
  hasSelectAll,
  searchTerm,
  selectedIds,
  onSearchTermChange,
  onToggleStage,
}: StatusDropdownContentProps) {
  return (
    <div className="p-2">
      <StatusSearchInput
        disabled={disabled}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
      />

      {filteredStages.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">No pipeline stages available</div>
      ) : (
        <div className="space-y-0.5">
          <StatusOptionButton
            badgeLabel="All"
            badgeVariant="default"
            checked={hasSelectAll}
            description="All pipeline stages"
            label="Select All"
            onClick={() => onToggleStage(STATUS_SELECT_ALL_ID)}
          />

          {filteredStages.map((stage) => {
            const count = getApplicantCountBadgeValue(applicantCounts, stage.id);

            return (
              <StatusOptionButton
                key={stage.id}
                badgeLabel={count?.toString()}
                checked={selectedIds.has(stage.id)}
                description={stage.description}
                label={stage.name}
                onClick={() => onToggleStage(stage.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
