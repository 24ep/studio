"use client";

import React from 'react';
import MobileApplicantDetail from './MobileApplicantDetail';

interface MobileApplicantDetailViewProps {
  applicantId: string;
  onClose?: () => void;
  onRefresh?: () => void;
}

export default function MobileApplicantDetailView({ 
  applicantId, 
  onClose,
  onRefresh
}: MobileApplicantDetailViewProps) {
  return (
    <MobileApplicantDetail
      applicantId={applicantId}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
}

