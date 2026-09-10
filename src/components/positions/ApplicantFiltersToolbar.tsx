"use client";

import type { ReactNode } from 'react';
import { Filter } from 'lucide-react';

import { ApplicantFilters as ApplicantFiltersComponent } from '@/components/applicants/ApplicantFilters';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ApplicantFilterValues, ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';

import { ApplicantSearchInput } from './ApplicantSearchInput';

interface ApplicantFiltersPopoverProps {
  applicantFilters: ApplicantFilterValues;
  availablePositions: Position[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  availableStages: RecruitmentStage[];
  isAiSearching: boolean;
  onAiSearch: (query: string) => void;
  onClearFilters?: () => void;
  onFilterChange: (filters: ApplicantFilterValues) => void;
}

export interface ApplicantFiltersToolbarProps extends ApplicantFiltersPopoverProps {
  children?: ReactNode;
  onSearchChange: (term: string) => void;
  searchPlaceholder: string;
  searchTerm: string;
  showSearchClear?: boolean;
}

export function ApplicantFiltersToolbar({
  children,
  onSearchChange,
  searchPlaceholder,
  searchTerm,
  showSearchClear,
  ...filterProps
}: ApplicantFiltersToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <ApplicantSearchInput
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
        showClear={showSearchClear}
        value={searchTerm}
      />
      <ApplicantFiltersPopover {...filterProps} />
      {children}
    </div>
  );
}

export function ApplicantFiltersPopover({
  applicantFilters,
  availablePositions,
  availableRecruiters,
  availableSources,
  availableStages,
  isAiSearching,
  onAiSearch,
  onClearFilters,
  onFilterChange,
}: ApplicantFiltersPopoverProps) {
  const filterCount = Object.keys(applicantFilters || {}).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {filterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {filterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" align="end">
        <ScrollArea className="h-[500px]">
          <div className="p-4">
            <ApplicantFiltersComponent
              initialFilters={applicantFilters}
              onFilterChange={onFilterChange}
              onAiSearch={onAiSearch}
              onClearAllFilters={onClearFilters || (() => onFilterChange({}))}
              availablePositions={availablePositions}
              availableStages={availableStages}
              availableRecruiter={availableRecruiters}
              availableSources={availableSources}
              isLoading={false}
              isAiSearching={isAiSearching}
            />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
