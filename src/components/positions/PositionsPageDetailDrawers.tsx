"use client";

import { PositionDetailDrawer } from "@/components/positions/PositionDetailDrawer";

export function PositionsPageDetailDrawers({
  editingPositionId,
  isEditDrawerOpen,
  isNewDrawerOpen,
  onEditDrawerOpenChange,
  onNewDrawerOpenChange,
  selectedPositionId,
}: {
  editingPositionId: string | null;
  isEditDrawerOpen: boolean;
  isNewDrawerOpen: boolean;
  onEditDrawerOpenChange: (open: boolean) => void;
  onNewDrawerOpenChange: (open: boolean) => void;
  selectedPositionId: string | null;
}) {
  return (
    <>
      <PositionDetailDrawer
        isOpen={isNewDrawerOpen}
        onOpenChange={onNewDrawerOpenChange}
        positionId={selectedPositionId}
      />

      <PositionDetailDrawer
        isOpen={isEditDrawerOpen}
        onOpenChange={onEditDrawerOpenChange}
        positionId={editingPositionId}
        initialEditMode={false}
      />
    </>
  );
}
