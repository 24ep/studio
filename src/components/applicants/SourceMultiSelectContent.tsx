"use client";

import {
  CheckIcon as Check,
  MagnifyingGlassIcon as Search,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ApplicantSource } from '@/lib/types';
import { ApplicantSourceOption } from './ApplicantSourceOption';
import {
  SOURCE_SELECT_ALL_ID,
  SOURCE_UNASSIGNED_ID,
} from './source-multi-select-utils';

interface SourceMultiSelectContentProps {
  disabled: boolean;
  filteredSources: ApplicantSource[];
  isSelectAllSelected: boolean;
  isUnassignedSelected: boolean;
  safeAvailableSources: ApplicantSource[];
  safeSelectedSourceIds: Set<string>;
  searchQuery: string;
  handleSelect: (sourceId: string) => void;
  setSearchQuery: (query: string) => void;
}

export function SourceMultiSelectContent({
  disabled,
  filteredSources,
  isSelectAllSelected,
  isUnassignedSelected,
  safeAvailableSources,
  safeSelectedSourceIds,
  searchQuery,
  handleSelect,
  setSearchQuery,
}: SourceMultiSelectContentProps) {
  return (
    <PopoverContent
      className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border shadow-lg max-h-[300px] overflow-y-auto"
      align="start"
      popoverId="source-multi-select-dropdown"
    >
      <div className="p-2">
        <div className="text-sm font-medium mb-2">Select Sources</div>
        <SourceSearchInput
          disabled={disabled}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <SourceOptionsList
          filteredSources={filteredSources}
          isSelectAllSelected={isSelectAllSelected}
          isUnassignedSelected={isUnassignedSelected}
          safeAvailableSources={safeAvailableSources}
          safeSelectedSourceIds={safeSelectedSourceIds}
          searchQuery={searchQuery}
          handleSelect={handleSelect}
        />
      </div>
    </PopoverContent>
  );
}

function SourceSearchInput({
  disabled,
  searchQuery,
  setSearchQuery,
}: Pick<SourceMultiSelectContentProps, 'disabled' | 'searchQuery' | 'setSearchQuery'>) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search sources..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        disabled={disabled}
      />
    </div>
  );
}

function SourceOptionsList({
  filteredSources,
  isSelectAllSelected,
  isUnassignedSelected,
  safeAvailableSources,
  safeSelectedSourceIds,
  searchQuery,
  handleSelect,
}: Omit<SourceMultiSelectContentProps, 'disabled' | 'setSearchQuery'>) {
  if (safeAvailableSources.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No sources available</div>;
  }

  if (filteredSources.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No sources found matching "{searchQuery}"</div>;
  }

  return (
    <div className="space-y-0.5">
      <SourceOptionButton
        description="All sources and unassigned Applicants"
        isSelected={isSelectAllSelected}
        label="Select All"
        onClick={() => handleSelect(SOURCE_SELECT_ALL_ID)}
      />
      <SourceOptionButton
        description="Applicants with no source assigned"
        isSelected={isUnassignedSelected}
        label="Unassigned"
        onClick={() => handleSelect(SOURCE_UNASSIGNED_ID)}
      />
      {filteredSources.map((source) => (
        <SourceOptionButton
          key={source.id}
          description={source.description}
          isSelected={safeSelectedSourceIds.has(source.id)}
          label={source.name}
          onClick={() => handleSelect(source.id)}
        />
      ))}
    </div>
  );
}

function SourceOptionButton({
  description,
  isSelected,
  label,
  onClick,
}: {
  description?: string | null;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm",
        isSelected && "bg-accent text-accent-foreground",
      )}
    >
      <div className="flex items-center">
        <Check className={cn("mr-2 h-3 w-3", isSelected ? "opacity-100" : "opacity-0")} />
        <ApplicantSourceOption name={label} description={description} />
      </div>
    </button>
  );
}

export function SourceMultiSelectClearButton({
  selectedSources,
  handleClearAll,
}: {
  selectedSources: ApplicantSource[];
  handleClearAll: () => void;
}) {
  if (selectedSources.length === 0) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClearAll}
      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
    >
      <X className="h-3 w-3" />
    </Button>
  );
}
