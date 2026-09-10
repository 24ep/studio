"use client";

import type React from "react";
import { ChevronDown, Users } from "lucide-react";
import { useLocalization } from '@/contexts/LocalizationContext';

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RecruiterAvatarCompact } from "@/components/ui/recruiter-avatar";
import type { MyTasksFilters, MyTasksRecruiter } from "@/components/tasks/my-tasks-page-utils";

interface RecruiterFilterProps {
  canSeeAllRecruiter: boolean;
  filters: MyTasksFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  recruiters: MyTasksRecruiter[];
}

export function RecruiterFilter({
  canSeeAllRecruiter,
  filters,
  onFiltersChange,
  recruiters,
}: RecruiterFilterProps) {
  const selectedRecruiter = recruiters.find((recruiter) => recruiter.id === filters.recruiterId);
  const { t } = useLocalization();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 w-48 text-sm justify-between"
        >
          <SelectedRecruiterLabel
            selectedRecruiter={selectedRecruiter}
            hasSelection={Boolean(filters.recruiterId)}
            localize={t}
          />
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
          <RecruiterFilterHeader onFiltersChange={onFiltersChange} localize={t} />
        <div className="p-2 max-h-64 overflow-y-auto">
          {canSeeAllRecruiter && (
            <AllRecruitersOption
              isSelected={!filters.recruiterId}
              onFiltersChange={onFiltersChange}
              localize={t}
            />
          )}

          {recruiters.map((recruiter) => (
            <RecruiterOption
              key={recruiter.id}
              isSelected={filters.recruiterId === recruiter.id}
              onFiltersChange={onFiltersChange}
              recruiter={recruiter}
              localize={t}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SelectedRecruiterLabel({
  hasSelection,
  selectedRecruiter,
  localize,
}: {
  hasSelection: boolean;
  selectedRecruiter: MyTasksRecruiter | undefined;
  localize: (key: string, fallback: string) => string;
}) {
  if (!hasSelection) {
    return <span className="text-muted-foreground">{localize("tasks.recruiters.all", "All Recruiters")}</span>;
  }

  if (!selectedRecruiter) {
    return <span>{localize("tasks.recruiters.unknownRecruiter", "Unknown recruiter")}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <RecruiterAvatarCompact
        user={{
          id: selectedRecruiter.id,
          name: selectedRecruiter.name || selectedRecruiter.id,
          avatarUrl: selectedRecruiter.avatarUrl,
          personalColor: selectedRecruiter.personalColor,
        }}
        size="xs"
      />
      <span className="truncate">{selectedRecruiter.name || selectedRecruiter.id}</span>
    </div>
  );
}

function RecruiterFilterHeader({
  onFiltersChange,
  localize,
}: Pick<RecruiterFilterProps, "onFiltersChange"> & {
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{localize("tasks.recruiters.select", "Select Recruiter")}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange((filters) => ({ ...filters, recruiterId: "" }))}
          className="h-6 px-2 text-xs"
        >
          {localize("common.all", "All")}
        </Button>
      </div>
    </div>
  );
}

function AllRecruitersOption({
  isSelected,
  onFiltersChange,
  localize,
}: Pick<RecruiterFilterProps, "onFiltersChange"> & {
  isSelected: boolean;
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onFiltersChange((filters) => ({ ...filters, recruiterId: "" }))}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Users className="h-3 w-3 text-gray-500" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-sm">{localize("tasks.recruiters.all", "All Recruiters")}</span>
        <span className="text-xs text-muted-foreground">{localize("tasks.recruiters.showAll", "Show all recruiters")}</span>
      </div>
      {isSelected && (
        <div className="w-3 h-3 rounded-full bg-primary" />
      )}
    </button>
  );
}

function RecruiterOption({
  isSelected,
  onFiltersChange,
  recruiter,
  localize,
}: Pick<RecruiterFilterProps, "onFiltersChange"> & {
  isSelected: boolean;
  recruiter: MyTasksRecruiter;
  localize: (key: string, fallback: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onFiltersChange((filters) => ({ ...filters, recruiterId: recruiter.id }))}
      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
    >
      <RecruiterAvatarCompact
        user={{
          id: recruiter.id,
          name: recruiter.name || recruiter.id,
          avatarUrl: recruiter.avatarUrl,
          personalColor: recruiter.personalColor,
        }}
        size="xs"
      />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium truncate">{recruiter.name || recruiter.id}</span>
        <span className="text-xs text-muted-foreground">{localize("common.recruiter", "Recruiter")}</span>
      </div>
      {isSelected && (
        <div className="w-3 h-3 rounded-full bg-primary" />
      )}
    </button>
  );
}
