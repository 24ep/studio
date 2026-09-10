"use client";

import type React from "react";
import { Search, Users } from "lucide-react";

import { PositionSelectDropdown } from "@/components/applicants/PositionSelectDropdown";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import type { MyTasksFilters } from "@/components/tasks/my-tasks-page-utils";
import { hasTaskboardFilterValues } from "@/components/tasks/my-tasks-page-utils";
import { useLocalization } from '@/contexts/LocalizationContext';

export { BoardHeaderActions } from "./MyTasksBoardHeaderActions";
export { RecruiterFilter } from "./MyTasksBoardRecruiterFilter";
export { StageFilter } from "./MyTasksBoardStageFilter";

interface ApplicantCountBadgeProps {
  displayedApplicantsCount: number;
  filters: MyTasksFilters;
  isRecruiter: boolean;
  loading: boolean;
  totalApplicants: number;
}

function getApplicantCountLabel({
  filters,
  isRecruiter,
  totalApplicants,
  displayedApplicantsCount,
  t,
}: Omit<ApplicantCountBadgeProps, "loading"> & {
  t: (key: string, fallback: string) => string;
}) {
  const hasManualFilters = hasTaskboardFilterValues(filters);
  const totalApplicantsLabel = t("tasks.applicantCount.total", "{total} applicants").replace(
    "{total}",
    `${totalApplicants}`,
  );

  if (!hasManualFilters && !isRecruiter) {
    return totalApplicantsLabel;
  }

  if (!hasManualFilters && isRecruiter) {
    return t(
      "tasks.applicantCount.assignedToYou",
      "{total} total applicants ({displayed} assigned to you)",
    )
      .replace("{total}", `${totalApplicants}`)
      .replace("{displayed}", `${displayedApplicantsCount}`);
  }

  return t("tasks.applicantCount.filtered", "{total} total applicants ({displayed} filtered)")
    .replace("{total}", `${totalApplicants}`)
    .replace("{displayed}", `${displayedApplicantsCount}`);
}

export function ApplicantCountBadge({
  displayedApplicantsCount,
  filters,
  isRecruiter,
  loading,
  totalApplicants,
}: ApplicantCountBadgeProps) {
  const { t } = useLocalization();

  return (
    <Badge variant="secondary" className="h-9 px-3 text-sm font-medium">
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
          {t("common.loading", "Loading...")}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3" />
          {getApplicantCountLabel({
            filters,
            isRecruiter,
            totalApplicants,
            displayedApplicantsCount,
            t,
          })}
        </div>
      )}
    </Badge>
  );
}

interface ApplicantSearchInputProps {
  filters: MyTasksFilters;
  loading: boolean;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  searchInputRef: React.Ref<HTMLInputElement>;
}

export function ApplicantSearchInput({
  filters,
  loading,
  onFiltersChange,
  searchInputRef,
}: ApplicantSearchInputProps) {
  const { t } = useLocalization();
  return (
    <div className="relative">
      {loading ? (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin rounded-full border-b-2 border-current" />
      ) : (
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      <Input
        ref={searchInputRef}
        className="pl-10 h-9 w-48 text-sm"
        placeholder={t("tasks.filters.searchApplicantsPlaceholder", "Search Applicants...")}
        value={filters.name || ""}
        onChange={(event) => onFiltersChange((filters) => ({ ...filters, name: event.target.value }))}
        disabled={loading}
      />
    </div>
  );
}

interface PositionFilterProps {
  filters: MyTasksFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
}

export function PositionFilter({ filters, onFiltersChange }: PositionFilterProps) {
  const { t } = useLocalization();
  return (
    <div className="w-48">
      <PositionSelectDropdown
        value={filters.positionId || ""}
        onValueChange={(value) => onFiltersChange((filters) => ({ ...filters, positionId: value || "" }))}
        placeholder={t("tasks.filters.allPositions", "All Positions")}
        showOpenStatus
        filterOpenOnly={false}
        showNoneOption
      />
    </div>
  );
}
