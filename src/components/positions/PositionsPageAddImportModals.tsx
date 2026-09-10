"use client";

import { AddPositionModal, type AddPositionFormValues } from "@/components/positions/AddPositionModal";
import { AddPositionMobileDrawer } from "@/components/positions/AddPositionMobileDrawer";
import { BulkMatchCriteriaModal } from "@/components/positions/BulkMatchCriteriaModal";
import { ImportPositionsModal } from "@/components/positions/ImportPositionsModal";

export function AddPositionResponsiveModal({
  isAddModalOpen,
  isMobile,
  onAddModalOpenChange,
  onAddPosition,
}: {
  isAddModalOpen: boolean;
  isMobile: boolean;
  onAddModalOpenChange: (open: boolean) => void;
  onAddPosition: (formData: AddPositionFormValues) => Promise<void>;
}) {
  return isMobile ? (
    <AddPositionMobileDrawer
      isOpen={isAddModalOpen}
      onOpenChange={onAddModalOpenChange}
      onAddPosition={onAddPosition}
    />
  ) : (
    <AddPositionModal
      isOpen={isAddModalOpen}
      onOpenChange={onAddModalOpenChange}
      onAddPosition={onAddPosition}
    />
  );
}

export function PositionsPageImportAndBulkModals({
  isBulkMatchCriteriaModalOpen,
  isImportModalOpen,
  onBulkMatchCriteriaModalOpenChange,
  onBulkMatchCriteriaUpdate,
  onImportModalOpenChange,
  onImportSuccess,
  selectedCount,
}: {
  isBulkMatchCriteriaModalOpen: boolean;
  isImportModalOpen: boolean;
  onBulkMatchCriteriaModalOpenChange: (open: boolean) => void;
  onBulkMatchCriteriaUpdate: (matchCriteria: string) => Promise<void>;
  onImportModalOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
  selectedCount: number;
}) {
  return (
    <>
      <ImportPositionsModal
        isOpen={isImportModalOpen}
        onOpenChange={onImportModalOpenChange}
        onImportSuccess={onImportSuccess}
      />
      <BulkMatchCriteriaModal
        isOpen={isBulkMatchCriteriaModalOpen}
        onClose={() => onBulkMatchCriteriaModalOpenChange(false)}
        onConfirm={onBulkMatchCriteriaUpdate}
        selectedCount={selectedCount}
      />
    </>
  );
}
