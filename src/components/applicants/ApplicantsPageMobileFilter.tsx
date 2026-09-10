"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicantFilters } from './ApplicantFilters';
import { FunnelIcon as Filter, XMarkIcon as X } from '@heroicons/react/24/outline';
import type { ApplicantFilterValues } from './ApplicantFilters';
import type { Position, RecruitmentStage, ApplicantSource } from '@/lib/types';

interface ApplicantsPageMobileFilterProps {
  isMobileFilterModalOpen: boolean;
  setIsMobileFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  onAiSearch: (query: string) => Promise<void>;
  onCancelAiSearch: () => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Array<{ id: string; name: string }>;
  availableSources: ApplicantSource[];
  onClearAllFilters: () => void;
  isLoading: boolean;
  isFilterDataLoading: boolean;
  isAiSearching: boolean;
  advancedQuery?: string;
}

export function ApplicantsPageMobileFilter({
  isMobileFilterModalOpen,
  setIsMobileFilterModalOpen,
  activeFilterCount,
  filters,
  onFilterChange,
  onAiSearch,
  onCancelAiSearch,
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  onClearAllFilters,
  isLoading,
  isFilterDataLoading,
  isAiSearching,
  advancedQuery,
}: ApplicantsPageMobileFilterProps) {
  return (
    <>
      {/* Floating Action Button for Mobile Filter */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        onClick={() => setIsMobileFilterModalOpen(true)}
      >
        <Filter className="h-6 w-6" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
            {activeFilterCount > 9 ? '9+' : activeFilterCount}
          </span>
        )}
        <span className="sr-only">Open filters</span>
      </Button>

      {/* Mobile Filter Modal */}
      <Dialog open={isMobileFilterModalOpen} onOpenChange={setIsMobileFilterModalOpen}>
        <DialogContent
          className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-[90vh] p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl bg-background flex flex-col"
          dialogId="Applicant-filter-modal"
          hideCloseButton
        >
          <DialogHeader className="px-4 pt-6 pb-6 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Filter Applicants</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsMobileFilterModalOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="mobile-filter-content flex-1 overflow-y-auto p-4">
            <ApplicantFilters
              initialFilters={filters}
              onFilterChange={onFilterChange}
              onAiSearch={onAiSearch}
              onCancelAiSearch={onCancelAiSearch}
              availablePositions={availablePositions}
              availableStages={availableStages}
              availableRecruiter={availableRecruiter}
              availableSources={availableSources}
              onClearAllFilters={onClearAllFilters}
              isLoading={isLoading || isFilterDataLoading}
              isAiSearching={isAiSearching}
              advancedQuery={advancedQuery}
            />
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
