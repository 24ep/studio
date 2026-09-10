import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { PositionDepartmentFilter } from "./PositionDepartmentFilter";
import {
  PositionGradeFilter,
  PositionHiringManagerFilter,
  PositionRecruiterFilter,
  PositionStatusFilterSelect,
} from "./PositionFilterSelects";
import {
  PositionFilterPanelHeader,
  PositionFilterTrigger,
} from "./PositionFiltersParts";
import type { PositionFiltersProps } from "./PositionFiltersTypes";

export function PositionFilters({
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  hiringManagerId,
  onHiringManagerChange,
  recruiterId,
  onRecruiterChange,
  allDepartments,
  availableRecruiters,
  availableHiringManagers,
  isLoadingDepartments,
  onClearFilters,
  activeFilterCount,
  gradeFilter,
  onGradeChange,
  allGrades,
}: PositionFiltersProps) {
  const [open, setOpen] = useState(false);
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");

  const handleDepartmentSelect = (department: string) => {
    onDepartmentChange(department);
    setDepartmentPopoverOpen(false);
    setDepartmentSearch("");
  };

  const filteredDepartments = allDepartments.filter((department) =>
    department.toLowerCase().includes(departmentSearch.toLowerCase()),
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <PositionFilterTrigger activeFilterCount={activeFilterCount} />
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-4" align="start">
          <div className="space-y-4">
            <PositionFilterPanelHeader
              activeFilterCount={activeFilterCount}
              onClearFilters={onClearFilters}
            />
            <PositionStatusFilterSelect
              statusFilter={statusFilter}
              onStatusChange={onStatusChange}
            />
            <PositionDepartmentFilter
              departmentFilter={departmentFilter}
              departmentPopoverOpen={departmentPopoverOpen}
              departmentSearch={departmentSearch}
              filteredDepartments={filteredDepartments}
              allDepartments={allDepartments}
              isLoadingDepartments={isLoadingDepartments}
              onDepartmentPopoverOpenChange={setDepartmentPopoverOpen}
              onDepartmentSearchChange={setDepartmentSearch}
              onDepartmentSelect={handleDepartmentSelect}
            />
            <PositionHiringManagerFilter
              hiringManagerId={hiringManagerId}
              availableHiringManagers={availableHiringManagers}
              onHiringManagerChange={onHiringManagerChange}
            />
            <PositionRecruiterFilter
              recruiterId={recruiterId}
              availableRecruiters={availableRecruiters}
              onRecruiterChange={onRecruiterChange}
            />
            <PositionGradeFilter
              gradeFilter={gradeFilter}
              allGrades={allGrades}
              onGradeChange={onGradeChange}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
