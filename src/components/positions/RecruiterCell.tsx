"use client";

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  RecruiterOptionsList,
  RecruiterReadonlyView,
  RecruiterSearchBox,
  RecruiterTriggerContent,
} from './RecruiterCellParts';
import type { RecruiterCellProps } from './RecruiterCellTypes';
import { useRecruiterCellState } from './use-recruiter-cell-state';

export function RecruiterCell({
  position,
  availableRecruiter,
  canManagePositions,
  isAssigning,
  onAssignRecruiter,
  onResetAssigning,
}: RecruiterCellProps) {
  const {
    currentRecruiter,
    filteredRecruiter,
    handleOpenChange,
    handleSelect,
    open,
    searchInputRef,
    searchTerm,
    setSearchTerm,
  } = useRecruiterCellState({
    position,
    availableRecruiter,
    isAssigning,
    onAssignRecruiter,
    onResetAssigning,
  });

  if (!canManagePositions) {
    return <RecruiterReadonlyView position={position} currentRecruiter={currentRecruiter} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open && !isAssigning} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <RecruiterTriggerContent
            position={position}
            currentRecruiter={currentRecruiter}
            isAssigning={isAssigning}
            open={open}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Select Recruiter</div>
            <RecruiterSearchBox
              searchInputRef={searchInputRef}
              searchTerm={searchTerm}
              onSearchChange={(event) => setSearchTerm(event.target.value)}
              onClearSearch={() => setSearchTerm('')}
            />
            <RecruiterOptionsList
              filteredRecruiter={filteredRecruiter}
              position={position}
              searchTerm={searchTerm}
              onSelectRecruiter={handleSelect}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
