"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { MyTasksFilters } from "./my-tasks-page-utils";
import {
  ActiveFiltersDisplay,
  MyTasksFilterFooter,
  MyTasksFilterHeader,
  MyTasksFilterTabs,
} from "./MyTasksFilterModalParts";
import type {
  MyTasksFilterPosition,
  MyTasksFilterRecruiter,
  MyTasksFilterStage,
} from "./my-tasks-filter-modal-utils";
import { useMyTasksFilterModal } from "./use-my-tasks-filter-modal";

interface MyTasksFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MyTasksFilters;
  onFiltersChange: (filters: MyTasksFilters) => void;
  stages: Array<MyTasksFilterStage | string>;
  positions: MyTasksFilterPosition[];
  recruiters: MyTasksFilterRecruiter[];
}

export function MyTasksFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  stages,
  positions,
  recruiters,
}: MyTasksFilterModalProps) {
  const {
    activeFilterCount,
    activeTab,
    hasActiveFilters,
    localFilters,
    selectedRecruiters,
    actions,
  } = useMyTasksFilterModal({
    open,
    filters,
    recruiters,
    onFiltersChange,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" dialogId="my-tasks-filter-modal">
        <MyTasksFilterHeader />
        <MyTasksFilterTabs
          activeTab={activeTab}
          filters={localFilters}
          recruiters={recruiters}
          selectedRecruiters={selectedRecruiters}
          stages={stages}
          actions={actions}
        />
        <ActiveFiltersDisplay
          activeFilterCount={activeFilterCount}
          filters={localFilters}
          hasActiveFilters={hasActiveFilters}
          positions={positions}
          recruiters={recruiters}
          onRemoveFilter={actions.handleRemoveFilter}
        />
        <MyTasksFilterFooter
          hasActiveFilters={hasActiveFilters}
          onApply={actions.handleApply}
          onCancel={() => onOpenChange(false)}
          onClear={actions.handleClear}
          onReset={actions.handleReset}
        />
      </DialogContent>
    </Dialog>
  );
}
