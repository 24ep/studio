"use client";

import { EvaluationActivePageStage } from "./components/EvaluationActivePageStage";
import type { LoadedEvaluationPageViewProps } from "./evaluation-page-view-types";
import { buildEvaluationActiveQuestionViewState } from "./utils";

export function EvaluationActiveFormBranch({
  allEvaluations,
  applicantId,
  appLogoUrl,
  evaluateHeaderStyle,
  evaluateHeaderTextColor,
  fileViewerOpen,
  formData,
  interviewers,
  isMobile,
  lineStyle,
  onActiveBack,
  onAllCompleted,
  onCommentsChange,
  onCommentsSelect,
  onEvaluationsUpdate,
  onFileViewerOpenChange,
  onNext,
  onPrevious,
  onQuestionSelect,
  onScoreChange,
  onSkipWaiting,
  onSubmit,
  personalityGroupsConfig,
  saving,
  selectedFile,
  showForm,
  skillsListRef,
  successModalOpen,
}: LoadedEvaluationPageViewProps) {
  const {
    isCommentsView,
    currentQuestion,
    progressLabel,
  } = buildEvaluationActiveQuestionViewState(formData);

  return (
    <EvaluationActivePageStage
      isMobile={isMobile}
      evaluateHeaderStyle={evaluateHeaderStyle}
      formData={formData}
      appLogoUrl={appLogoUrl}
      evaluateHeaderTextColor={evaluateHeaderTextColor}
      onBack={onActiveBack}
      fileViewerOpen={fileViewerOpen}
      onFileViewerOpenChange={onFileViewerOpenChange}
      selectedFile={selectedFile}
      successModalOpen={successModalOpen}
      applicantId={applicantId}
      interviewers={interviewers}
      allEvaluations={allEvaluations}
      onEvaluationsUpdate={onEvaluationsUpdate}
      onSkipWaiting={onSkipWaiting}
      onAllCompleted={onAllCompleted}
      showForm={showForm}
      lineStyle={lineStyle}
      skillsListRef={skillsListRef}
      personalityGroupsConfig={personalityGroupsConfig}
      isCommentsView={isCommentsView}
      currentQuestion={currentQuestion}
      progressLabel={progressLabel}
      saving={saving}
      onScoreChange={onScoreChange}
      onCommentsChange={onCommentsChange}
      onNext={onNext}
      onPrevious={onPrevious}
      onSubmit={onSubmit}
      onQuestionSelect={onQuestionSelect}
      onCommentsSelect={onCommentsSelect}
    />
  );
}
