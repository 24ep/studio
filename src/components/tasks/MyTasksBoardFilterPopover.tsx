"use client";

import React from "react";
import { Filter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  MyTasksFilters,
  MyTasksRecruiter,
  MyTasksStage,
} from "@/components/tasks/my-tasks-page-utils";

import {
  PositionFilter,
  RecruiterFilter,
  StageFilter,
} from "./MyTasksBoardHeaderParts";
import { useLocalization } from '@/contexts/LocalizationContext';

interface MyTasksBoardFilterPopoverProps {
  canSeeAllRecruiter: boolean;
  filters: MyTasksFilters;
  isStageFilterOpen: boolean;
  onClearFilters: () => void;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  onStageFilterOpenChange: (open: boolean) => void;
  onToggleStageSelection: (stageId: string) => void;
  recruiters: MyTasksRecruiter[];
  selectedStages: string[];
  stages: MyTasksStage[];
}

export function MyTasksBoardFilterPopover({
  canSeeAllRecruiter,
  filters,
  isStageFilterOpen,
  onClearFilters,
  onFiltersChange,
  onStageFilterOpenChange,
  onToggleStageSelection,
  recruiters,
  selectedStages,
  stages,
}: MyTasksBoardFilterPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useLocalization();
  const activeFilterCount = getTaskBoardActiveFilterCount(filters, selectedStages);
  const handleClearAll = () => {
    onClearFilters();
    selectedStages.forEach(onToggleStageSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background">
          <Filter className="h-4 w-4" />
          {t("tasks.filters.filter", "Filter")}
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
            >
              {activeFilterCount > 9 ? "9+" : activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex max-h-[80vh] w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden p-0"
        popoverId="task-board-filter-popover"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t("tasks.filters.filterApplicants", "Filter applicants")}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(false)}
            aria-label={t("tasks.filters.closeFilters", "Close filters")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <FilterField label={t("tasks.filters.position", "Position")}>
              <PositionFilter filters={filters} onFiltersChange={onFiltersChange} />
            </FilterField>
            <FilterField label={t("tasks.filters.recruiters", "Recruiters")}>
              <RecruiterFilter
                canSeeAllRecruiter={canSeeAllRecruiter}
                filters={filters}
                onFiltersChange={onFiltersChange}
                recruiters={recruiters}
              />
            </FilterField>
            <FilterField label={t("tasks.filters.stage", "Stage")}>
              <StageFilter
                isStageFilterOpen={isStageFilterOpen}
                onStageFilterOpenChange={onStageFilterOpenChange}
                onToggleStageSelection={onToggleStageSelection}
                selectedStages={selectedStages}
                stages={stages}
              />
            </FilterField>
          </div>

        </div>

        <div className="flex justify-end border-t px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            {t("tasks.filters.clearAll", "Clear all")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function getTaskBoardActiveFilterCount(filters: MyTasksFilters, selectedStages: string[]) {
  return [
    Boolean(filters.positionId),
    Boolean(filters.recruiterId),
    selectedStages.length > 0,
  ].filter(Boolean).length;
}
