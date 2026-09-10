"use client";

import type { RefObject } from 'react';

import type { Applicant, Position } from '@/lib/types';
import type { AveragedEvaluationData, EvaluationRecord } from '../types';
import {
  ReportApplicantAvatar,
  ReportApplicantSummary,
  ReportBrandHeader,
  ReportEvaluators,
} from './ReportHeaderParts';

interface ReportHeaderProps {
  applicant: Applicant;
  position: Position | null;
  organizationLogoUrl: string | null;
  organizationName: string | null;
  appLogoUrl: string | null;
  averagedEvaluationData: AveragedEvaluationData | null;
  allEvaluations: EvaluationRecord[];
  canEditApplicantBasic: () => boolean;
  avatarUploading: boolean;
  avatarInputRef: RefObject<HTMLInputElement>;
  handleAvatarUpload: (file: File) => Promise<void>;
}

export function ReportHeader({
  applicant,
  position,
  organizationLogoUrl,
  organizationName,
  appLogoUrl,
  averagedEvaluationData,
  allEvaluations,
  canEditApplicantBasic,
  avatarUploading,
  avatarInputRef,
  handleAvatarUpload,
}: ReportHeaderProps) {
  return (
    <div className="border-b-2 border-gray-200 pb-6 mb-8">
      <ReportBrandHeader
        organizationLogoUrl={organizationLogoUrl}
        organizationName={organizationName}
        appLogoUrl={appLogoUrl}
      />

      <div className="mb-6 flex items-start gap-4">
        <ReportApplicantAvatar
          applicant={applicant}
          canEditApplicantBasic={canEditApplicantBasic}
          avatarUploading={avatarUploading}
          avatarInputRef={avatarInputRef}
          handleAvatarUpload={handleAvatarUpload}
        />
        <ReportApplicantSummary applicant={applicant} position={position} />
      </div>

      <ReportEvaluators
        averagedEvaluationData={averagedEvaluationData}
        allEvaluations={allEvaluations}
      />
    </div>
  );
}

