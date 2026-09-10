import { XMarkIcon as X } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import type { Position } from "@/lib/types";
import type { PositionMultiSelectActions } from "./PositionMultiSelectDropdownTypes";

interface PositionTriggerContentProps {
  actions: PositionMultiSelectActions;
  error: boolean;
  hasNotApplied: boolean;
  loading: boolean;
  placeholder: string;
  selectedIds: Set<string>;
  selectedPositions: Position[];
}

export function PositionTriggerContent({
  actions,
  error,
  hasNotApplied,
  loading,
  placeholder,
  selectedIds,
  selectedPositions,
}: PositionTriggerContentProps) {
  if (loading) {
    return <span className="text-muted-foreground">Loading positions...</span>;
  }

  if (error) {
    return (
      <button
        type="button"
        className="text-destructive underline"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          actions.refreshPositions();
        }}
      >
        Failed to load positions. Retry
      </button>
    );
  }

  if (selectedIds.size === 0) {
    return <span className="text-muted-foreground">{placeholder}</span>;
  }

  return (
    <>
      {hasNotApplied && (
        <PositionSelectionBadge
          id="not-applied"
          label="Not Applied"
          onRemove={actions.removePosition}
        />
      )}
      {selectedPositions.map((position) => (
        <PositionSelectionBadge
          key={position.id}
          id={position.id}
          label={position.title}
          onRemove={actions.removePosition}
        />
      ))}
    </>
  );
}

function PositionSelectionBadge({
  id,
  label,
  onRemove,
}: {
  id: string;
  label: string;
  onRemove: PositionMultiSelectActions["removePosition"];
}) {
  return (
    <Badge variant="secondary" className="text-xs">
      {label}
      <button
        type="button"
        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onRemove(id, event);
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => onRemove(id, event)}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}
