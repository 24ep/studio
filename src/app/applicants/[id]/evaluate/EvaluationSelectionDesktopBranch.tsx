"use client";

import { DesktopEvaluatePage } from "./DesktopEvaluatePage";
import type { LoadedEvaluationPageViewProps } from "./evaluation-page-view-types";

export function EvaluationSelectionDesktopBranch({
  allDbPositions,
  allEvaluations,
  applicantData,
  applicantId,
  appLogoUrl,
  attachments,
  availableRecruiters,
  availableSources,
  availableStages,
  canEditRemark,
  canEditScores,
  canRemoveInterviewer,
  canResetEvaluation,
  evaluateHeaderBackgroundColor,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundType,
  evaluateHeaderTextColor,
  formData,
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
  onBackToInterview,
  onInterviewerSelect,
  onRefreshEvaluation,
  onRemarkChange,
  onRemoveInterviewer,
  onResetEvaluation,
  onStartEvaluate,
  onTestingResultRemove,
  onTestingResultScoreChange,
  personalityGroupsConfig,
  positionId,
  positionTitle,
  remarkText,
  searchParams,
  selectedInterviewerId,
  testingResults,
  testingResultsRef,
}: LoadedEvaluationPageViewProps) {
  return (
    <DesktopEvaluatePage
      applicantId={applicantId}
      applicantData={applicantData}
      attachments={attachments}
      testingResults={testingResults}
      interviewers={interviewers}
      allEvaluations={allEvaluations}
      selectedInterviewerId={selectedInterviewerId}
      onInterviewerSelect={(id) => onInterviewerSelect(id, allEvaluations.get(id) || null)}
      onTestResultUpdate={(index, newScore) => onTestingResultScoreChange(index, newScore, true)}
      onTestResultRemove={canRemoveInterviewer ? onTestingResultRemove : undefined}
      onBack={onBackToInterview}
      appLogoUrl={appLogoUrl}
      evaluateHeaderBackgroundType={evaluateHeaderBackgroundType}
      evaluateHeaderBackgroundImage={evaluateHeaderBackgroundImage}
      evaluateHeaderBackgroundGradient={evaluateHeaderBackgroundGradient}
      evaluateHeaderBackgroundColor={evaluateHeaderBackgroundColor}
      evaluateHeaderTextColor={evaluateHeaderTextColor}
      remarkText={remarkText}
      onRemarkChange={(text) => onRemarkChange(text, undefined, 1000)}
      allDbPositions={allDbPositions}
      availableStages={availableStages}
      availableRecruiters={availableRecruiters}
      availableSources={availableSources}
      onRefresh={onRefreshEvaluation}
      onStartEvaluate={onStartEvaluate}
      canEditRemark={canEditRemark}
      interviewerSelectedBgColor={interviewerSelectedBgColor}
      interviewerSelectedTextColor={interviewerSelectedTextColor}
      interviewerSelectedBorderColor={interviewerSelectedBorderColor}
      interviewerSelectedBorderWidth={interviewerSelectedBorderWidth}
      interviewerNonSelectedBgColor={interviewerNonSelectedBgColor}
      interviewerNonSelectedTextColor={interviewerNonSelectedTextColor}
      interviewerNonSelectedBorderColor={interviewerNonSelectedBorderColor}
      interviewerNonSelectedBorderWidth={interviewerNonSelectedBorderWidth}
      canResetEvaluation={canResetEvaluation}
      canRemoveInterviewer={canRemoveInterviewer}
      positionId={positionId}
      positionTitle={positionTitle}
      onResetEvaluation={onResetEvaluation}
      onRemoveInterviewer={onRemoveInterviewer}
      formData={formData}
      personalityGroupsConfig={personalityGroupsConfig}
      searchParams={searchParams}
      interviewerNameColor={interviewerNameColor}
      canEditScores={canEditScores}
      testingResultsRef={testingResultsRef}
    />
  );
}
