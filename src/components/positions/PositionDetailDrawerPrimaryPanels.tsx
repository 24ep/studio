import { CriteriaTab } from './CriteriaTab';
import { DetailsTab } from './DetailsTab';
import { JobDescriptionTab } from './JobDescriptionTab';
import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';

export function PositionDetailsPanel({
  availableRecruiters,
  form,
  grades,
  isDrawerReady,
  isEditMode,
  isLoadingLevels,
  isMobile,
  isSaving,
  onCancel,
  onCustomFieldChange,
  onEdit,
  onSave,
  position,
  positionLevels,
}: PositionDetailDrawerContentProps) {
  if (!position) return null;

  return (
    <DetailsTab
      position={position}
      isEditMode={isEditMode}
      isSaving={isSaving}
      isDrawerReady={isDrawerReady}
      isLoadingLevels={isLoadingLevels}
      positionLevels={positionLevels}
      grades={grades}
      availableRecruiters={availableRecruiters}
      form={form}
      isMobile={isMobile}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      onCustomFieldChange={onCustomFieldChange}
    />
  );
}

export function PositionJobDescriptionPanel({
  form,
  isDrawerReady,
  isEditMode,
  isGeneratingDescription,
  isMobile,
  isSaving,
  onCancel,
  onCustomFieldChange,
  onEdit,
  onGenerateJobDescription,
  onSave,
  position,
}: PositionDetailDrawerContentProps) {
  if (!position) return null;

  return (
    <JobDescriptionTab
      position={position}
      isEditMode={isEditMode}
      isSaving={isSaving}
      isGeneratingDescription={isGeneratingDescription}
      isDrawerReady={isDrawerReady}
      form={form}
      isMobile={isMobile}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      onGenerateJobDescription={onGenerateJobDescription}
      onCustomFieldChange={onCustomFieldChange}
    />
  );
}

export function PositionCriteriaPanel({
  defaultMatchCriteria,
  form,
  isDrawerReady,
  isEditMode,
  isMobile,
  isSaving,
  onCancel,
  onCustomFieldChange,
  onEdit,
  onSave,
  onUseDefaultCriteria,
  position,
}: PositionDetailDrawerContentProps) {
  if (!position) return null;

  return (
    <CriteriaTab
      position={position}
      isEditMode={isEditMode}
      isSaving={isSaving}
      isDrawerReady={isDrawerReady}
      defaultMatchCriteria={defaultMatchCriteria}
      form={form}
      isMobile={isMobile}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
      onUseDefaultCriteria={onUseDefaultCriteria}
      onCustomFieldChange={onCustomFieldChange}
    />
  );
}
