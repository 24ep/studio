"use client";

import { Download, Plus, Search, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Grade } from "@/lib/types";

import { PositionFilters } from "./PositionFilters";
import type { PositionStatusFilter } from "./position-page-utils";

interface PositionsDesktopToolbarProps {
  isLoading: boolean;
  total: number;
  openPositionCount: number;
  searchTerm: string;
  statusFilter: PositionStatusFilter;
  departmentFilter: string;
  selectedHiringManagerId: string | null;
  selectedRecruiterId: string | null;
  allDepartments: string[];
  availableHiringManagers: Array<{ id: string; name: string }>;
  availableRecruiters: Array<{ id: string; name: string }>;
  isLoadingDepartments: boolean;
  activeFilterCount: number;
  gradeFilter: string | null;
  allGrades: Grade[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PositionStatusFilter) => void;
  onDepartmentChange: (value: string) => void;
  onHiringManagerChange: (value: string | null) => void;
  onRecruiterChange: (value: string | null) => void;
  onClearFilters: () => void;
  onGradeChange: (value: string | null) => void;
  onAddPosition: () => void;
  onImportPositions: () => void;
  onExportPositions: () => void;
}

function PositionsDesktopToolbarSkeleton() {
  return (
    <div className="hidden flex-shrink-0 flex-col gap-3 border-b border-slate-100 bg-white p-4 md:flex lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-2">
        <div className="h-5 w-36 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-72 animate-pulse rounded-[8px] bg-slate-100 dark:bg-zinc-800" />
        <div className="h-10 w-24 animate-pulse rounded-[8px] bg-slate-100 dark:bg-zinc-800" />
        <div className="h-10 w-32 animate-pulse rounded-[8px] bg-slate-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function PositionsDesktopToolbar({
  isLoading,
  total,
  openPositionCount,
  searchTerm,
  statusFilter,
  departmentFilter,
  selectedHiringManagerId,
  selectedRecruiterId,
  allDepartments,
  availableHiringManagers,
  availableRecruiters,
  isLoadingDepartments,
  activeFilterCount,
  gradeFilter,
  allGrades,
  onSearchChange,
  onStatusChange,
  onDepartmentChange,
  onHiringManagerChange,
  onRecruiterChange,
  onClearFilters,
  onGradeChange,
  onAddPosition,
  onImportPositions,
  onExportPositions,
}: PositionsDesktopToolbarProps) {
  if (isLoading) {
    return <PositionsDesktopToolbarSkeleton />;
  }

  const nonSearchFilterCount = Math.max(0, activeFilterCount - (searchTerm ? 1 : 0));

  return (
    <div className="hidden flex-shrink-0 flex-col gap-3 border-b border-slate-100 bg-white p-4 md:flex lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-zinc-50">Positions</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {total} {total === 1 ? "position" : "positions"}
          {openPositionCount > 0 && ` · ${openPositionCount} open`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block w-72 xl:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 w-full rounded-[8px] border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950"
            placeholder="Search positions"
            aria-label="Search positions"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Clear position search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <PositionFilters
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          departmentFilter={departmentFilter}
          onDepartmentChange={onDepartmentChange}
          hiringManagerId={selectedHiringManagerId}
          onHiringManagerChange={onHiringManagerChange}
          recruiterId={selectedRecruiterId}
          onRecruiterChange={onRecruiterChange}
          allDepartments={allDepartments}
          availableHiringManagers={availableHiringManagers}
          availableRecruiters={availableRecruiters}
          isLoadingDepartments={isLoadingDepartments}
          onClearFilters={onClearFilters}
          activeFilterCount={nonSearchFilterCount}
          gradeFilter={gradeFilter}
          onGradeChange={onGradeChange}
          allGrades={allGrades.map((grade) => ({
            ...grade,
            color: grade.color || undefined,
          }))}
        />

        <Button onClick={onAddPosition} className="h-10 whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" />
          New Position
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 whitespace-nowrap">
              <Upload className="mr-2 h-4 w-4" />
              Import / Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-[8px]">
            <DropdownMenuItem onClick={onImportPositions}>
              <Upload className="mr-2 h-4 w-4" />
              Import Positions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportPositions}>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
