"use client";

import ApplicantDetailModal from "@/components/applicants/ApplicantDetailModal";

interface PositionDetailApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  selectedApplicantId: string | null;
}

export function PositionDetailApplicantModal({
  isOpen,
  onClose,
  onRefresh,
  selectedApplicantId,
}: PositionDetailApplicantModalProps) {
  if (!selectedApplicantId || !isOpen) {
    return null;
  }

  return (
    <ApplicantDetailModal
      applicantId={selectedApplicantId}
      open={isOpen}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
}
