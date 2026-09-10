"use client";

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

import { useChartSetup } from '@/hooks/use-chart-setup';

import {
  buildEvaluateResultPrintGroupIds,
  groupPersonalityTraits,
  groupExpertiseSkills,
} from './utils';
import { ReportHeader } from './components/ReportHeader';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { PersonalityEvaluation } from './components/PersonalityEvaluation';
import { RemarksSection } from './components/RemarksSection';
import { OrganizationFooter } from './components/OrganizationFooter';
import { PrintStyles } from './components/PrintStyles';
import { EvaluateResultToolbar } from './components/EvaluateResultToolbar';
import { useEvaluateResultAvatarUpload } from './use-evaluate-result-avatar-upload';
import { useEvaluateResultPageData } from './use-evaluate-result-page-data';

export function EvaluateResultPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = params.id as string;
  const isEmbedded = searchParams.get('embedded') === 'true';
  const { data: session } = useSession();
  const { chartReady } = useChartSetup();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['detailed-analysis']));

  const pageData = useEvaluateResultPageData(applicantId);
  const {
    avatarInputRef,
    avatarUploading,
    canEditApplicantBasic,
    handleAvatarUpload,
  } = useEvaluateResultAvatarUpload({
    applicant: pageData.applicant,
    setApplicant: pageData.setApplicant,
    user: session?.user,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handlePrint = () => {
    setExpandedGroups(buildEvaluateResultPrintGroupIds(
      pageData.averagedEvaluationData,
      pageData.personalityGroupsConfig
    ));

    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (pageData.loading) {
    return <EvaluateResultLoadingState />;
  }

  if (!pageData.applicant) {
    return <EvaluateResultNotFoundState />;
  }

  const personalityGroups = groupPersonalityTraits(
    pageData.averagedEvaluationData,
    pageData.personalityGroupsConfig
  );
  const expertiseGroups = groupExpertiseSkills(
    pageData.averagedEvaluationData,
    pageData.personalityGroupsConfig
  );

  return (
    <>
      <PrintStyles isInIframe={pageData.isInIframe} />
      <div className="min-h-screen">
        {!isEmbedded && (
          <EvaluateResultToolbar
            onBack={() => router.push(`/applicants/${applicantId}/evaluate`)}
            onPrint={handlePrint}
          />
        )}

        <div className="p-8 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
          {!isEmbedded && (
            <ReportHeader
              applicant={pageData.applicant}
              position={pageData.position}
              organizationLogoUrl={pageData.headerSettings.organizationLogoUrl}
              organizationName={pageData.headerSettings.organizationName}
              appLogoUrl={pageData.headerSettings.appLogoUrl}
              averagedEvaluationData={pageData.averagedEvaluationData}
              allEvaluations={pageData.allEvaluations}
              canEditApplicantBasic={canEditApplicantBasic}
              avatarUploading={avatarUploading}
              avatarInputRef={avatarInputRef}
              handleAvatarUpload={handleAvatarUpload}
            />
          )}

          <ExecutiveSummary
            averagedEvaluationData={pageData.averagedEvaluationData}
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
            averagedEvaluationData={pageData.averagedEvaluationData}
            allEvaluations={pageData.allEvaluations}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
          />

          <RemarksSection allEvaluations={pageData.allEvaluations} />

          {!isEmbedded && (
            <OrganizationFooter
              organizationName={pageData.headerSettings.organizationName}
              organizationAddress={pageData.headerSettings.organizationAddress}
              organizationContact={pageData.headerSettings.organizationContact}
            />
          )}
        </div>
      </div>
    </>
  );
}

function EvaluateResultLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading evaluation data...</span>
      </div>
    </div>
  );
}

function EvaluateResultNotFoundState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Applicant not found</AlertDescription>
      </Alert>
    </div>
  );
}
