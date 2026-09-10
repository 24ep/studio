"use client";

import React from 'react';

import type { Applicant, Position } from '@/lib/types';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { OrganizationFooter } from './components/OrganizationFooter';
import { PersonalityEvaluation } from './components/PersonalityEvaluation';
import { RemarksSection } from './components/RemarksSection';
import { ReportHeader } from './components/ReportHeader';
import type { AveragedEvaluationData, EvaluationRecord, GroupedSkill, GroupedTrait } from './types';

interface EvaluateReportBodyProps {
  allEvaluations: EvaluationRecord[];
  appLogoUrl: string | null;
  applicant: Applicant;
  averagedEvaluationData: AveragedEvaluationData | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  avatarUploading: boolean;
  canEditApplicantBasic: () => boolean;
  chartReady: boolean;
  expandedGroups: Set<string>;
  expertiseGroups: GroupedSkill[];
  handleAvatarUpload: (file: File) => Promise<void>;
  isEmbedded: boolean;
  organizationAddress: string | null;
  organizationContact: string | null;
  organizationLogoUrl: string | null;
  organizationName: string | null;
  personalityGroups: GroupedTrait[];
  position: Position | null;
  toggleGroup: (groupId: string) => void;
}

export function EvaluateReportBody({
  allEvaluations,
  appLogoUrl,
  applicant,
  averagedEvaluationData,
  avatarInputRef,
  avatarUploading,
  canEditApplicantBasic,
  chartReady,
  expandedGroups,
  expertiseGroups,
  handleAvatarUpload,
  isEmbedded,
  organizationAddress,
  organizationContact,
  organizationLogoUrl,
  organizationName,
  personalityGroups,
  position,
  toggleGroup,
}: EvaluateReportBodyProps) {
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-4xl mx-auto">
      {!isEmbedded && (
        <ReportHeader
          applicant={applicant}
          position={position}
          organizationLogoUrl={organizationLogoUrl}
          organizationName={organizationName}
          appLogoUrl={appLogoUrl}
          averagedEvaluationData={averagedEvaluationData}
          allEvaluations={allEvaluations}
          canEditApplicantBasic={canEditApplicantBasic}
          avatarUploading={avatarUploading}
          avatarInputRef={avatarInputRef}
          handleAvatarUpload={handleAvatarUpload}
        />
      )}

      <ExecutiveSummary
        averagedEvaluationData={averagedEvaluationData}
        personalityGroups={personalityGroups}
        expertiseGroups={expertiseGroups}
        chartReady={chartReady}
      />

      <DetailedAnalysis
        expertiseGroups={expertiseGroups}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
      />

      <PersonalityEvaluation
        personalityGroups={personalityGroups}
        averagedEvaluationData={averagedEvaluationData}
        allEvaluations={allEvaluations}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
      />

      <RemarksSection allEvaluations={allEvaluations} />

      {!isEmbedded && (
        <OrganizationFooter
          organizationName={organizationName}
          organizationAddress={organizationAddress}
          organizationContact={organizationContact}
        />
      )}
    </div>
  );
}
