"use client";

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EvaluateHeader } from './components/EvaluateHeader';
import { PersonalitySkillsOverview } from './components/PersonalitySkillsOverview';
import { OverallScoreSection } from './components/OverallScoreSection';
import { TestingResultsSection } from './components/TestingResultsSection';
import {
  areAllEvaluationsComplete,
  buildEvaluateHeaderStyle,
  DesktopEvaluateApplicantInfo,
  DesktopEvaluateDialogs,
  DesktopEvaluateFloatingActions,
  DesktopEvaluateInterviewerTabs,
} from './DesktopEvaluatePageParts';
import type { EvaluationAttachment } from './types';
import type { DesktopEvaluatePageProps } from './DesktopEvaluatePageTypes';

export function DesktopEvaluatePage({
  applicantId,
  applicantData,
  attachments,
  testingResults,
  interviewers,
  allEvaluations,
  selectedInterviewerId,
  onInterviewerSelect,
  onTestResultUpdate,
  onBack,
  appLogoUrl,
  evaluateHeaderBackgroundType,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundColor,
  evaluateHeaderTextColor,
  remarkText = '',
  onRemarkChange,
  onStartEvaluate,
  canEditRemark = true,
  interviewerSelectedBgColor = '220 25% 97%',
  interviewerSelectedTextColor = '0 0% 0%',
  interviewerSelectedBorderColor = '220 15% 50%',
  interviewerSelectedBorderWidth = '2px',
  interviewerNonSelectedBgColor = '220 25% 97%',
  interviewerNonSelectedTextColor = '220 25% 50%',
  interviewerNonSelectedBorderColor = '220 15% 85%',
  interviewerNonSelectedBorderWidth = '1px',
  interviewerNameColor = '220 25% 30%',
  canResetEvaluation = false,
  canRemoveInterviewer = false,
  positionTitle = null,
  onResetEvaluation,
  onRemoveInterviewer,
  formData,
  personalityGroupsConfig,
  searchParams,
  canEditScores = false,
  testingResultsRef,
}: DesktopEvaluatePageProps) {
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<EvaluationAttachment | null>(null);
  const router = useRouter();
  const localTestingResultsRef = useRef(testingResults);
  const effectiveTestingResultsRef = testingResultsRef || localTestingResultsRef;

  const themeProps = {
    evaluateHeaderBackgroundType,
    evaluateHeaderBackgroundImage,
    evaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor,
    evaluateHeaderTextColor,
  };
  const headerStyle = buildEvaluateHeaderStyle(themeProps);
  const allEvaluationsComplete = useMemo(
    () => areAllEvaluationsComplete(interviewers, allEvaluations),
    [interviewers, allEvaluations]
  );
  const evaluation = selectedInterviewerId ? allEvaluations.get(selectedInterviewerId) : null;
  const handleTestingResultsBlur = () => {
    effectiveTestingResultsRef.current = testingResults;
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col text-foreground">
        <div className="flex-shrink-0" style={headerStyle}>
          <EvaluateHeader
            applicantName={applicantData?.name || 'Unknown Applicant'}
            appLogoUrl={appLogoUrl}
            evaluateHeaderTextColor={evaluateHeaderTextColor}
            onBack={onBack}
            showBackButton
          />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          <DesktopEvaluateApplicantInfo
            applicantData={applicantData}
            attachments={attachments}
            onAttachmentPreview={(attachment) => {
              setSelectedAttachment(attachment);
              setIsPreviewModalOpen(true);
            }}
          />

          <div className="w-full lg:w-[60%] p-8 lg:pl-12 lg:pr-12 space-y-10">
            {testingResults.length > 0 && (
              <TestingResultsSection
                testingResults={testingResults}
                canEditScores={canEditScores}
                onScoreChange={(index, score) => {
                  onTestResultUpdate?.(index, score);
                }}
                onBlur={handleTestingResultsBlur}
                testingResultsRef={effectiveTestingResultsRef}
              />
            )}

            <DesktopEvaluateInterviewerTabs
              interviewers={interviewers}
              allEvaluations={allEvaluations}
              selectedInterviewerId={selectedInterviewerId}
              positionTitle={positionTitle}
              canResetEvaluation={canResetEvaluation}
              canRemoveInterviewer={canRemoveInterviewer}
              interviewerSelectedBgColor={interviewerSelectedBgColor}
              interviewerSelectedTextColor={interviewerSelectedTextColor}
              interviewerSelectedBorderColor={interviewerSelectedBorderColor}
              interviewerSelectedBorderWidth={interviewerSelectedBorderWidth}
              interviewerNonSelectedBgColor={interviewerNonSelectedBgColor}
              interviewerNonSelectedTextColor={interviewerNonSelectedTextColor}
              interviewerNonSelectedBorderColor={interviewerNonSelectedBorderColor}
              interviewerNonSelectedBorderWidth={interviewerNonSelectedBorderWidth}
              onInterviewerSelect={onInterviewerSelect}
              onResetEvaluation={onResetEvaluation}
              onRemoveInterviewer={onRemoveInterviewer}
            />

            <div>
              <OverallScoreSection
                selectedInterviewerId={selectedInterviewerId}
                interviewers={interviewers}
                existingEvaluation={evaluation || null}
                interviewerNameColor={interviewerNameColor}
                onStartEvaluation={() => {
                  if (onStartEvaluate) {
                    onStartEvaluate();
                  } else {
                    router.push(`/applicants/${applicantId}/evaluate-result`);
                  }
                }}
              />

              <div className="mt-8">
                {evaluation ? (
                  <PersonalitySkillsOverview
                    existingEvaluation={evaluation}
                    formData={formData}
                    personalityGroupsConfig={personalityGroupsConfig}
                    searchParams={searchParams}
                    onTraitClick={(traitId: string) => {
                      onStartEvaluate?.(traitId);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DesktopEvaluateFloatingActions
        {...themeProps}
        allEvaluationsComplete={allEvaluationsComplete}
        canEditRemark={canEditRemark}
        remarkText={remarkText}
        onReportClick={() => setIsReportModalOpen(true)}
        onRemarkClick={() => setRemarkModalOpen(true)}
      />

      <DesktopEvaluateDialogs
        applicantId={applicantId}
        selectedAttachment={selectedAttachment}
        remarkModalOpen={remarkModalOpen}
        previewModalOpen={isPreviewModalOpen}
        reportModalOpen={isReportModalOpen}
        remarkText={remarkText}
        onRemarkChange={onRemarkChange}
        onRemarkModalOpenChange={setRemarkModalOpen}
        onPreviewModalOpenChange={setIsPreviewModalOpen}
        onReportModalOpenChange={setIsReportModalOpen}
      />
    </>
  );
}
