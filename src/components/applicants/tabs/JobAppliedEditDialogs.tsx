import {
  JOB_APPLIED_EMPTY_SELECT_VALUE,
  fromJobAppliedSelectValue,
  toJobAppliedSelectValue,
} from "./job-applied-tab-utils";
import {
  JobAppliedSalaryEditDialog,
  JobAppliedSelectEditDialog,
} from "./JobAppliedEditDialogParts";

interface JobAppliedEditDialogsProps {
  isEditStatusOpen: boolean;
  isEditSourceOpen: boolean;
  isEditRecruiterOpen: boolean;
  isEditSalaryOpen: boolean;
  isUpdating: boolean;
  selectedStatus: string;
  selectedSourceId: string;
  selectedRecruiterId: string;
  selectedSalary: string;
  availableStages: Array<{ id: string; name: string }>;
  availableSources: Array<{ id: string; name: string }>;
  availableRecruiters: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  onStatusOpenChange: (open: boolean) => void;
  onSourceOpenChange: (open: boolean) => void;
  onRecruiterOpenChange: (open: boolean) => void;
  onSalaryOpenChange: (open: boolean) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onRecruiterChange: (value: string) => void;
  onSalaryChange: (value: string) => void;
  onUpdateStatus: () => void;
  onUpdateSource: () => void;
  onUpdateRecruiter: () => void;
  onUpdateSalary: () => void;
}

const emptySelectOption = {
  label: "None",
  value: JOB_APPLIED_EMPTY_SELECT_VALUE,
};

export function JobAppliedEditDialogs({
  isEditStatusOpen,
  isEditSourceOpen,
  isEditRecruiterOpen,
  isEditSalaryOpen,
  isUpdating,
  selectedStatus,
  selectedSourceId,
  selectedRecruiterId,
  selectedSalary,
  availableStages,
  availableSources,
  availableRecruiters,
  onStatusOpenChange,
  onSourceOpenChange,
  onRecruiterOpenChange,
  onSalaryOpenChange,
  onStatusChange,
  onSourceChange,
  onRecruiterChange,
  onSalaryChange,
  onUpdateStatus,
  onUpdateSource,
  onUpdateRecruiter,
  onUpdateSalary,
}: JobAppliedEditDialogsProps) {
  return (
    <>
      <JobAppliedSelectEditDialog
        fieldId="status"
        isUpdating={isUpdating}
        items={availableStages}
        label="Status"
        onOpenChange={onStatusOpenChange}
        onSubmit={onUpdateStatus}
        onValueChange={onStatusChange}
        open={isEditStatusOpen}
        placeholder="Select status"
        requireValue
        title="Update Status"
        value={selectedStatus}
      />

      <JobAppliedSelectEditDialog
        emptyOption={emptySelectOption}
        fieldId="source"
        isUpdating={isUpdating}
        items={availableSources}
        label="Source"
        onOpenChange={onSourceOpenChange}
        onSubmit={onUpdateSource}
        onValueChange={value => onSourceChange(fromJobAppliedSelectValue(value))}
        open={isEditSourceOpen}
        placeholder="Select source"
        title="Update Source"
        value={toJobAppliedSelectValue(selectedSourceId)}
      />

      <JobAppliedSelectEditDialog
        emptyOption={emptySelectOption}
        fieldId="recruiter"
        isUpdating={isUpdating}
        items={availableRecruiters}
        label="Recruiter"
        onOpenChange={onRecruiterOpenChange}
        onSubmit={onUpdateRecruiter}
        onValueChange={value => onRecruiterChange(fromJobAppliedSelectValue(value))}
        open={isEditRecruiterOpen}
        placeholder="Select recruiter"
        showAvatars
        title="Assign Recruiter"
        value={toJobAppliedSelectValue(selectedRecruiterId)}
      />

      <JobAppliedSalaryEditDialog
        isUpdating={isUpdating}
        onOpenChange={onSalaryOpenChange}
        onSubmit={onUpdateSalary}
        onValueChange={onSalaryChange}
        open={isEditSalaryOpen}
        value={selectedSalary}
      />
    </>
  );
}
