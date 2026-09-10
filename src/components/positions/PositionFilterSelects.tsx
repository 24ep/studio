import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalization } from '@/contexts/LocalizationContext';
import { EmployeeOption } from '@/components/hr/EmployeeOption';
import { RecruiterAvatar } from '@/components/ui/recruiter-avatar';

import type {
  PositionFilterGrade,
  PositionFilterHiringManager,
  PositionFilterRecruiter,
  PositionFiltersProps,
} from "./PositionFiltersTypes";

type PositionStatusFilter = PositionFiltersProps["statusFilter"];

interface PositionStatusFilterSelectProps {
  statusFilter: PositionStatusFilter;
  onStatusChange: (value: PositionStatusFilter) => void;
}

export function PositionStatusFilterSelect({
  statusFilter,
  onStatusChange,
}: PositionStatusFilterSelectProps) {
  const { t } = useLocalization();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("positions.filters.status", "Status")}</label>
      <Select
        value={statusFilter || "all"}
        onValueChange={(value) => onStatusChange(value as PositionStatusFilter)}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={t("positions.filters.status", "Status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("positions.filters.allStatuses", "All Statuses")}</SelectItem>
          <SelectItem value="open">{t("positions.status.open", "Open")}</SelectItem>
          <SelectItem value="closed">{t("positions.status.closed", "Closed")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface PositionHiringManagerFilterProps {
  hiringManagerId: string | null;
  availableHiringManagers: PositionFilterHiringManager[];
  onHiringManagerChange: (value: string | null) => void;
}

export function PositionHiringManagerFilter({
  hiringManagerId,
  availableHiringManagers,
  onHiringManagerChange,
}: PositionHiringManagerFilterProps) {
  const { t } = useLocalization();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("positions.filters.hiringManager", "Hiring Manager")}</label>
      <Select
        value={hiringManagerId || "all"}
        onValueChange={(value) => onHiringManagerChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={t("positions.filters.allHiringManagers", "All Hiring Managers")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("positions.filters.allHiringManagers", "All Hiring Managers")}</SelectItem>
          {availableHiringManagers.map((hiringManager) => (
            <SelectItem key={hiringManager.id} value={hiringManager.id}>
              <EmployeeOption name={hiringManager.name} avatarUrl={hiringManager.avatarUrl} detail="Hiring manager" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface PositionRecruiterFilterProps {
  recruiterId: string | null;
  availableRecruiters: PositionFilterRecruiter[];
  onRecruiterChange: (value: string | null) => void;
}

export function PositionRecruiterFilter({
  recruiterId,
  availableRecruiters,
  onRecruiterChange,
}: PositionRecruiterFilterProps) {
  const { t } = useLocalization();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("positions.filters.recruiter", "Recruiter")}</label>
      <Select
        value={recruiterId || "all"}
        onValueChange={(value) => onRecruiterChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={t("positions.filters.allRecruiters", "All Recruiters")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("positions.filters.allRecruiters", "All Recruiters")}</SelectItem>
          <SelectItem value="unassigned">{t("positions.filters.unassignedRecruiter", "No Recruiter Assigned")}</SelectItem>
          {availableRecruiters.map((recruiter) => (
            <SelectItem key={recruiter.id} value={recruiter.id}>
              <span className="flex items-center gap-2.5"><RecruiterAvatar user={recruiter} size="xs" showBorder={false} /><span>{recruiter.name}</span></span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface PositionGradeFilterProps {
  gradeFilter: string | null;
  allGrades: PositionFilterGrade[];
  onGradeChange: (value: string | null) => void;
}

export function PositionGradeFilter({
  gradeFilter,
  allGrades,
  onGradeChange,
}: PositionGradeFilterProps) {
  const { t } = useLocalization();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("positions.filters.grade", "Grade")}</label>
      <Select
        value={gradeFilter || "all"}
        onValueChange={(value) => onGradeChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={t("positions.filters.allGrades", "All Grades")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("positions.filters.allGrades", "All Grades")}</SelectItem>
          {allGrades.map((grade) => (
            <SelectItem key={grade.id} value={grade.id}>
              <div className="flex items-center gap-2">
                {grade.color && (
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: grade.color }} />
                )}
                {grade.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
