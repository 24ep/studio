import type { PositionStatusFilter } from "./position-page-utils";

export interface PositionFilterGrade {
  id: string;
  name: string;
  color?: string;
}

export interface PositionFilterHiringManager {
  id: string;
  name: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export interface PositionFilterRecruiter {
  id: string;
  name: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export interface PositionFiltersProps {
  statusFilter: PositionStatusFilter;
  onStatusChange: (value: PositionStatusFilter) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  hiringManagerId: string | null;
  onHiringManagerChange: (value: string | null) => void;
  recruiterId: string | null;
  onRecruiterChange: (value: string | null) => void;
  allDepartments: string[];
  availableRecruiters: PositionFilterRecruiter[];
  availableHiringManagers: PositionFilterHiringManager[];
  isLoadingDepartments: boolean;
  onClearFilters: () => void;
  activeFilterCount: number;
  gradeFilter: string | null;
  onGradeChange: (value: string | null) => void;
  allGrades: PositionFilterGrade[];
}
