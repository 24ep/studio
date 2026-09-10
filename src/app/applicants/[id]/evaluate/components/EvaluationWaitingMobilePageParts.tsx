"use client";

import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { ApplicantAssetsSection } from "./ApplicantAssetsSection";
import { EvaluationReportDrawer } from "./EvaluationReportDrawer";
import { InterviewerSelectionSection } from "./InterviewerSelectionSection";
import { OverallScoreSection } from "./OverallScoreSection";
import { PersonalitySkillsOverview } from "./PersonalitySkillsOverview";
import { RemarkSection } from "./RemarkSection";
import { TestingResultsSection } from "./TestingResultsSection";
import type { EvaluationWaitingMobilePageProps } from "./EvaluationWaitingMobilePage";

export function EvaluationWaitingMobileContent({
  allEvaluations,
  applicantData,
  applicantId,
  attachments,
  canEditScores,
  evaluateHeaderBackgroundColor,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundType,
  evaluateHeaderTextColor,
  evaluationLinkRequireLogin,
  existingEvaluation,
  formData,
  hasToken,
  interviewerNameColor,
  interviewerNonSelectedBgColor,
  interviewerNonSelectedBorderColor,
  interviewerNonSelectedBorderWidth,
  interviewerNonSelectedTextColor,
  interviewerSelectedBgColor,
  interviewerSelectedBorderColor,
  interviewerSelectedBorderWidth,
  interviewerSelectedTextColor,
  interviewers,
  onCloseRemark,
  onFileSelect,
  onInterviewerSelect,
  onRemarkChange,
  onReportClick,
  onStartEvaluation,
  onTestingResultScoreChange,
  onTestingResultsBlur,
  onTraitClick,
  personalityGroupsConfig,
  remarkSaved,
  remarkSectionVisible,
  remarkText,
  savingRemark,
  searchParams,
  selectedInterviewerId,
  status,
  testingResults,
  testingResultsRef,
}: EvaluationWaitingMobilePageProps) {
  return (
    <>
      <ApplicantAssetsSection
        attachments={attachments}
        applicantId={applicantId}
        onFileSelect={onFileSelect}
      />
      <div className="border-t my-4 -mx-6 sm:-mx-10" />

      {testingResults.length > 0 && (
        <>
          <TestingResultsSection
            testingResults={testingResults}
            canEditScores={canEditScores}
            onScoreChange={onTestingResultScoreChange}
            onBlur={onTestingResultsBlur}
            testingResultsRef={testingResultsRef}
          />
          <div className="border-t my-4 -mx-6 sm:-mx-10" />
        </>
      )}

      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 sm:gap-6">
        <InterviewerSelectionSection
          interviewers={interviewers}
          selectedInterviewerId={selectedInterviewerId}
          allEvaluations={allEvaluations}
          hasToken={hasToken}
          evaluationLinkRequireLogin={evaluationLinkRequireLogin}
          status={status}
          applicantData={applicantData}
          interviewerSelectedBgColor={interviewerSelectedBgColor}
          interviewerSelectedTextColor={interviewerSelectedTextColor}
          interviewerSelectedBorderColor={interviewerSelectedBorderColor}
          interviewerSelectedBorderWidth={interviewerSelectedBorderWidth}
          interviewerNonSelectedBgColor={interviewerNonSelectedBgColor}
          interviewerNonSelectedTextColor={interviewerNonSelectedTextColor}
          interviewerNonSelectedBorderColor={interviewerNonSelectedBorderColor}
          interviewerNonSelectedBorderWidth={interviewerNonSelectedBorderWidth}
          onInterviewerSelect={onInterviewerSelect}
        />

        <div className="order-2 md:order-none md:col-span-8 space-y-6">
          <OverallScoreSection
            selectedInterviewerId={selectedInterviewerId}
            interviewers={interviewers}
            existingEvaluation={existingEvaluation}
            interviewerNameColor={interviewerNameColor}
            onStartEvaluation={onStartEvaluation}
          />

          {existingEvaluation && formData.questions && formData.questions.length > 0 && (
            <PersonalitySkillsOverview
              existingEvaluation={existingEvaluation}
              formData={formData}
              personalityGroupsConfig={personalityGroupsConfig}
              searchParams={searchParams}
              onTraitClick={onTraitClick}
            />
          )}
        </div>
      </div>

      {remarkSectionVisible && (
        <RemarkSection
          remarkText={remarkText}
          savingRemark={savingRemark}
          remarkSaved={remarkSaved}
          interviewers={interviewers}
          allEvaluations={allEvaluations}
          onRemarkChange={onRemarkChange}
          onReportClick={onReportClick}
          onClose={onCloseRemark}
          evaluateHeaderBackgroundType={evaluateHeaderBackgroundType}
          evaluateHeaderBackgroundImage={evaluateHeaderBackgroundImage}
          evaluateHeaderBackgroundGradient={evaluateHeaderBackgroundGradient}
          evaluateHeaderBackgroundColor={evaluateHeaderBackgroundColor}
          evaluateHeaderTextColor={evaluateHeaderTextColor}
        />
      )}
    </>
  );
}

export function EvaluationWaitingMobileOverlays({
  applicantId,
  fileViewerOpen,
  isMobile,
  onFileViewerOpenChange,
  onOpenReportInNewPage,
  onReportDrawerOpenChange,
  reportDrawerOpen,
  selectedFile,
}: EvaluationWaitingMobilePageProps) {
  return (
    <>
      <FileViewerModal
        isOpen={fileViewerOpen}
        onOpenChange={onFileViewerOpenChange}
        file={selectedFile}
      />

      {!isMobile && (
        <EvaluationReportDrawer
          isOpen={reportDrawerOpen}
          applicantId={applicantId}
          onOpenChange={onReportDrawerOpenChange}
          onOpenInNewPage={onOpenReportInNewPage}
        />
      )}
    </>
  );
}
