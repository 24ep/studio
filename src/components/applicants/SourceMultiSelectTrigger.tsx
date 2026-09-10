"use client";

import {
  ChevronUpDownIcon as ChevronsUpDown,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PopoverTrigger } from '@/components/ui/popover';
import type { ApplicantSource } from '@/lib/types';
import {
  SOURCE_SELECT_ALL_ID,
  SOURCE_UNASSIGNED_ID,
} from './source-multi-select-utils';

interface SourceMultiSelectTriggerProps {
  disabled: boolean;
  isSelectAllSelected: boolean;
  isUnassignedSelected: boolean;
  open: boolean;
  placeholder: string;
  selectedSources: ApplicantSource[];
  handleRemove: (sourceId: string) => void;
}

export function SourceMultiSelectTrigger({
  disabled,
  isSelectAllSelected,
  isUnassignedSelected,
  open,
  placeholder,
  selectedSources,
  handleRemove,
}: SourceMultiSelectTriggerProps) {
  const hasSelection = selectedSources.length > 0 || isUnassignedSelected || isSelectAllSelected;

  return (
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full min-w-full justify-between min-h-[40px] h-auto py-2"
        disabled={disabled}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {!hasSelection ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <SourceSelectionBadges
              isSelectAllSelected={isSelectAllSelected}
              isUnassignedSelected={isUnassignedSelected}
              selectedSources={selectedSources}
              handleRemove={handleRemove}
            />
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
  );
}

function SourceSelectionBadges({
  handleRemove,
  isSelectAllSelected,
  isUnassignedSelected,
  selectedSources,
}: Pick<
  SourceMultiSelectTriggerProps,
  'handleRemove' | 'isSelectAllSelected' | 'isUnassignedSelected' | 'selectedSources'
>) {
  if (isSelectAllSelected) {
    return (
      <SourceSelectionBadge
        label="All Sources"
        sourceId={SOURCE_SELECT_ALL_ID}
        onRemove={handleRemove}
      />
    );
  }

  return (
    <>
      {isUnassignedSelected && (
        <SourceSelectionBadge
          label="Unassigned"
          sourceId={SOURCE_UNASSIGNED_ID}
          onRemove={handleRemove}
        />
      )}
      {selectedSources.map((source) => (
        <SourceSelectionBadge
          key={source.id}
          label={source.name}
          sourceId={source.id}
          onRemove={handleRemove}
        />
      ))}
    </>
  );
}

function SourceSelectionBadge({
  label,
  onRemove,
  sourceId,
}: {
  label: string;
  onRemove: (sourceId: string) => void;
  sourceId: string;
}) {
  return (
    <Badge variant="secondary" className="text-xs">
      {label}
      <button
        type="button"
        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onRemove(sourceId);
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={() => onRemove(sourceId)}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );
}
