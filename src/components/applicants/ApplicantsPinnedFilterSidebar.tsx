"use client";

import type React from 'react';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import type { ApplicantFilterValues } from '@/lib/types';
import type { ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';

import { ApplicantFilters } from './ApplicantFilters';

interface ApplicantsPinnedFilterSidebarProps {
  sidebarRef: React.RefObject<HTMLDivElement>;
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  onAiSearch: (query: string) => void;
  onCancelAiSearch: () => void;
  onClearAllFilters: () => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  isLoading: boolean;
  isAiSearching: boolean;
  advancedQuery?: string;
  onUnpin: () => void;
}

export function ApplicantsPinnedFilterSidebar({
  sidebarRef,
  filters,
  onFilterChange,
  onAiSearch,
  onCancelAiSearch,
  onClearAllFilters,
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  isLoading,
  isAiSearching,
  advancedQuery,
  onUnpin,
}: ApplicantsPinnedFilterSidebarProps) {
  return (
    <div
      ref={sidebarRef}
      className="w-[320px] min-w-[320px] border-r bg-background flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-semibold text-sm">Filters</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onUnpin}
            title="Unpin sidebar"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ApplicantFilters
          initialFilters={filters}
          onFilterChange={onFilterChange}
          onAiSearch={onAiSearch}
          onCancelAiSearch={onCancelAiSearch}
          onClearAllFilters={onClearAllFilters}
          availablePositions={availablePositions}
          availableStages={availableStages}
          availableRecruiter={availableRecruiter}
          availableSources={availableSources}
          isLoading={isLoading}
          isAiSearching={isAiSearching}
          advancedQuery={advancedQuery}
          autoApply={true}
          showActionButtons={false}
          className="border-none shadow-none p-0"
        />
      </div>
    </div>
  );
}
