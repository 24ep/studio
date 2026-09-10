"use client";

import {
  CheckIcon as Check,
  MagnifyingGlassIcon as Search,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';
import type { ChangeEvent, RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import type { ApplicantSource } from '@/lib/types';
import type { ApplicantSourceCellApplicant } from './ApplicantSourceCellTypes';

export interface ApplicantSourcePopoverProps {
  applicant: ApplicantSourceCellApplicant;
  filteredSources: ApplicantSource[];
  searchInputRef: RefObject<HTMLInputElement>;
  searchTerm: string;
  clearSearch: () => void;
  handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSelect: (sourceId: string | null) => void;
}

export function SourceSearchBox({
  clearSearch,
  handleSearchChange,
  searchInputRef,
  searchTerm,
}: Pick<ApplicantSourcePopoverProps, 'clearSearch' | 'handleSearchChange' | 'searchInputRef' | 'searchTerm'>) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={searchInputRef}
        placeholder="Search sources..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="pl-10 pr-10 h-8 text-sm focus:ring-2 focus:ring-primary/20"
        data-search-input
        autoComplete="off"
        spellCheck="false"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear source search"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-accent"
          onClick={clearSearch}
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function SourceOptionList({
  applicant,
  filteredSources,
  handleSelect,
  searchTerm,
}: Pick<ApplicantSourcePopoverProps, 'applicant' | 'filteredSources' | 'handleSelect' | 'searchTerm'>) {
  return (
    <div className="max-h-[300px] overflow-y-auto">
      <button
        type="button"
        onClick={() => handleSelect(null)}
        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
      >
        <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <X className="h-3 w-3 text-gray-500" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-sm">No source</span>
          <span className="text-xs text-muted-foreground">Remove source assignment</span>
        </div>
        {!applicant.sourceId && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </button>

      {filteredSources.length > 0 && (
        <div className="border-t border-border my-2" />
      )}

      <AvailableSourceOptions
        applicant={applicant}
        filteredSources={filteredSources}
        handleSelect={handleSelect}
        searchTerm={searchTerm}
      />
    </div>
  );
}

function AvailableSourceOptions({
  applicant,
  filteredSources,
  handleSelect,
  searchTerm,
}: Pick<ApplicantSourcePopoverProps, 'applicant' | 'filteredSources' | 'handleSelect' | 'searchTerm'>) {
  if (filteredSources.length === 0) {
    return (
      <div className="p-2 text-center">
        <p className="text-sm text-muted-foreground">
          {searchTerm.trim()
            ? `No sources found matching "${searchTerm}"`
            : 'No sources available'}
        </p>
      </div>
    );
  }

  return filteredSources.map((source) => (
    <button
      type="button"
      key={source.id}
      onClick={() => handleSelect(source.id)}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <SourceLogo source={source} />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium">{source.name}</span>
        <span className="text-xs text-muted-foreground">Source</span>
      </div>
      {applicant.sourceId === source.id && (
        <Check className="h-4 w-4 text-primary" />
      )}
    </button>
  ));
}

export function SourceLogo({
  className,
  source,
}: {
  className?: string;
  source: ApplicantSource;
}) {
  if (!source.logo) {
    return null;
  }

  return (
    <img
      src={convertMinIOUrlToSecureUrl(source.logo, { thumbnail: true, width: 32, height: 32 }) || source.logo}
      alt={source.name}
      className={cn("h-5 w-5 object-contain rounded-full", className)}
      loading="lazy"
    />
  );
}
