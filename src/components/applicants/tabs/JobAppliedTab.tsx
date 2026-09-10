import React from 'react';
import type { Applicant, CustomFieldValue, Position } from '@/lib/types';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { CustomFieldDisplay } from '../CustomFieldDisplay';
import { CustomFieldEdit } from '../CustomFieldEdit';
import { JobAppliedDetailsCard } from './JobAppliedDetailsCard';
import { JobAppliedEditDialogs } from './JobAppliedEditDialogs';
import { JobAppliedPositionCard } from './JobAppliedPositionCard';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  getAppliedPosition,
  getJobAppliedAssignments,
  type JobAppliedNamedEntity,
} from './job-applied-tab-utils';
import { useJobAppliedTabController } from './use-job-applied-tab-controller';

interface JobAppliedTabProps {
  applicant: Applicant;
  allDbPositions: Position[];
  isEditing: boolean;
  onCopyJobApplied: () => void;
  copiedJobApplied: boolean;
  appliedJobId: string | null;
  appliedFitScore: number | null;
  appliedJustification: string[];
  appliedJobBadge: React.ReactNode;
  onOpenPositionDrawer: (positionId: string) => void;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
  availableStages?: JobAppliedNamedEntity[];
  availableRecruiters?: JobAppliedNamedEntity[];
  availableSources?: JobAppliedNamedEntity[];
  onRefresh?: () => void;
  hideApplicantDetails?: boolean;
  register?: UseFormRegister<EditApplicantFormValues>;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
}

export const JobAppliedTab: React.FC<JobAppliedTabProps> = ({
  applicant,
  allDbPositions,
  isEditing,
  onCopyJobApplied,
  copiedJobApplied,
  appliedJobId,
  appliedFitScore,
  appliedJustification,
  appliedJobBadge,
  onOpenPositionDrawer,
  onCustomFieldChange,
  availableStages = [],
  availableRecruiters = [],
  availableSources = [],
  onRefresh,
  hideApplicantDetails = false,
  register,
  setValue,
}) => {
  const { settings: globalSettings } = useGlobalSettings();
  const orgLogoUrl = globalSettings.organizationLogoDataUrl;
  const editController = useJobAppliedTabController({ applicant, onRefresh, setValue });

  const {
    currentStage,
    currentRecruiter,
    currentSource,
  } = getJobAppliedAssignments({
    applicant,
    stages: availableStages,
    recruiters: availableRecruiters,
    sources: availableSources,
  });
  const appliedPosition = getAppliedPosition(allDbPositions, appliedJobId);
  const appliedCompany = applicant.company || applicant.position?.company || appliedPosition?.company || null;

  return (
    <div className="space-y-4">
      <JobAppliedPositionCard
        appliedJobId={appliedJobId}
        appliedPosition={appliedPosition}
        appliedFitScore={appliedFitScore}
        appliedJustification={appliedJustification}
        appliedJobBadge={appliedJobBadge}
        copiedJobApplied={copiedJobApplied}
        isEditing={isEditing}
        company={appliedCompany}
        orgLogoUrl={orgLogoUrl}
        expectedSalary={applicant.expectedSalary}
        register={register}
        onCopyJobApplied={onCopyJobApplied}
        onOpenPositionDrawer={onOpenPositionDrawer}
        onEditSalary={editController.openSalaryDialog}
      />

      {!hideApplicantDetails && (
        <JobAppliedDetailsCard
          expectedSalary={applicant.expectedSalary}
          currentStage={currentStage}
          currentSource={currentSource}
          currentRecruiter={currentRecruiter}
          onEditStatus={editController.openStatusDialog}
          onEditSource={editController.openSourceDialog}
          onEditRecruiter={editController.openRecruiterDialog}
          onEditSalary={editController.openSalaryDialog}
        />
      )}

      {isEditing ? (
        <CustomFieldEdit
          modelName="Applicant"
          section="jobs"
          entityId={applicant.id}
          customFields={applicant.customFields || {}}
          onFieldChange={onCustomFieldChange || (() => { })}
          title="Additional Job Information"
        />
      ) : (
        <CustomFieldDisplay
          modelName="Applicant"
          section="jobs"
          entityId={applicant.id}
          customFields={applicant.customFields || {}}
          title="Additional Job Information"
        />
      )}

      <JobAppliedEditDialogs
        isEditStatusOpen={editController.isEditStatusOpen}
        isEditSourceOpen={editController.isEditSourceOpen}
        isEditRecruiterOpen={editController.isEditRecruiterOpen}
        isEditSalaryOpen={editController.isEditSalaryOpen}
        isUpdating={editController.isUpdating}
        selectedStatus={editController.selectedStatus}
        selectedSourceId={editController.selectedSourceId}
        selectedRecruiterId={editController.selectedRecruiterId}
        selectedSalary={editController.selectedSalary}
        availableStages={availableStages}
        availableSources={availableSources}
        availableRecruiters={availableRecruiters}
        onStatusOpenChange={editController.setIsEditStatusOpen}
        onSourceOpenChange={editController.setIsEditSourceOpen}
        onRecruiterOpenChange={editController.setIsEditRecruiterOpen}
        onSalaryOpenChange={editController.setIsEditSalaryOpen}
        onStatusChange={editController.setSelectedStatus}
        onSourceChange={editController.setSelectedSourceId}
        onRecruiterChange={editController.setSelectedRecruiterId}
        onSalaryChange={editController.setSelectedSalary}
        onUpdateStatus={editController.handleUpdateStatus}
        onUpdateSource={editController.handleUpdateSource}
        onUpdateRecruiter={editController.handleUpdateRecruiter}
        onUpdateSalary={editController.handleUpdateSalary}
      />
    </div>
  );
};
