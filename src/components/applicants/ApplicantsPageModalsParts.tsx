import { AddApplicantModal } from './AddApplicantModal';
import BulkUploadCVsModal from '@/components/BulkUploadCVsModal';
import ApplicantImportModal from './ApplicantImportModal';
import { PositionDetailDrawer } from '@/components/positions/PositionDetailDrawer';
import { ApplicantSettingsDrawer } from './ApplicantSettingsDrawer';
import type { ApplicantsPageModalsProps } from './ApplicantsPageModalsTypes';
export {
  BulkRecruiterAssignmentDialog,
  BulkStatusChangeDialog,
} from './ApplicantsPageBulkDialogs';

type CoreApplicantsPageModalsProps = Pick<
  ApplicantsPageModalsProps,
  | 'isAddModalOpen'
  | 'setIsAddModalOpen'
  | 'availableStages'
  | 'availableSources'
  | 'onApplicantCreated'
  | 'isBulkUploadModalOpen'
  | 'setIsBulkUploadModalOpen'
  | 'onBulkUploadSuccess'
  | 'isImportModalOpen'
  | 'setIsImportModalOpen'
  | 'onImportSuccess'
  | 'isPositionDrawerOpen'
  | 'setIsPositionDrawerOpen'
  | 'selectedPositionForEdit'
  | 'isSettingsDrawerOpen'
  | 'setIsSettingsDrawerOpen'
  | 'applicantSettings'
  | 'onSettingsChange'
  | 'settingsLoading'
  | 'settingsError'
  | 'clearSettingsError'
>;

export function CoreApplicantsPageModals({
  isAddModalOpen,
  setIsAddModalOpen,
  availableStages,
  availableSources,
  onApplicantCreated,
  isBulkUploadModalOpen,
  setIsBulkUploadModalOpen,
  onBulkUploadSuccess,
  isImportModalOpen,
  setIsImportModalOpen,
  onImportSuccess,
  isPositionDrawerOpen,
  setIsPositionDrawerOpen,
  selectedPositionForEdit,
  isSettingsDrawerOpen,
  setIsSettingsDrawerOpen,
  applicantSettings,
  onSettingsChange,
  settingsLoading,
  settingsError,
  clearSettingsError,
}: CoreApplicantsPageModalsProps) {
  return (
    <>
      <AddApplicantModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        availableStages={availableStages}
        availableSources={availableSources}
        onApplicantCreated={onApplicantCreated}
      />

      <BulkUploadCVsModal
        isOpen={isBulkUploadModalOpen}
        onOpenChange={setIsBulkUploadModalOpen}
        onUploadSuccess={onBulkUploadSuccess}
      />

      <ApplicantImportModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportSuccess={onImportSuccess}
      />

      <PositionDetailDrawer
        isOpen={isPositionDrawerOpen}
        onOpenChange={setIsPositionDrawerOpen}
        positionId={selectedPositionForEdit?.id || null}
      />

      <ApplicantSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onOpenChange={setIsSettingsDrawerOpen}
        currentSettings={applicantSettings || undefined}
        onSettingsChange={onSettingsChange}
        isLoading={settingsLoading}
        error={settingsError}
        onClearError={clearSettingsError}
      />
    </>
  );
}
