"use client";

import type React from "react";

import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { EvaluationWaitingPage } from "@/components/applicants/EvaluationWaitingPage";

import type {
  EvaluationAttachmentPreview,
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationQuestion,
  EvaluationSummary,
  Interviewer,
} from "../types";
import { EvaluationActiveForm } from "./EvaluationActiveForm";
import { EvaluationActiveHeader } from "./EvaluationActiveHeader";

interface EvaluationActivePageStageProps {
  isMobile: boolean;
  evaluateHeaderStyle: React.CSSProperties;
  formData: EvaluationFormData;
  appLogoUrl: string | null;
  evaluateHeaderTextColor: string;
  onBack: () => void;
  fileViewerOpen: boolean;
  onFileViewerOpenChange: (open: boolean) => void;
  selectedFile: EvaluationAttachmentPreview | null;
  successModalOpen: boolean;
  applicantId: string;
  interviewers: Interviewer[];
  allEvaluations: Map<string, EvaluationSummary>;
  onEvaluationsUpdate: (evaluations: Map<string, EvaluationSummary>) => void;
  onSkipWaiting: () => void;
  onAllCompleted: () => void;
  showForm: boolean;
  lineStyle: { left: string; width: string } | null;
  skillsListRef: React.RefObject<HTMLDivElement>;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  isCommentsView: boolean;
  currentQuestion: EvaluationQuestion | null;
  progressLabel: string;
  saving: boolean;
  onScoreChange: (questionId: string, score: number) => void;
  onCommentsChange: (comments: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onQuestionSelect: (index: number) => void;
  onCommentsSelect: () => void;
}

export function EvaluationActivePageStage({
  isMobile,
  evaluateHeaderStyle,
  formData,
  appLogoUrl,
  evaluateHeaderTextColor,
  onBack,
  fileViewerOpen,
  onFileViewerOpenChange,
  selectedFile,
  successModalOpen,
  applicantId,
  interviewers,
  allEvaluations,
  onEvaluationsUpdate,
  onSkipWaiting,
  onAllCompleted,
  showForm,
  lineStyle,
  skillsListRef,
  personalityGroupsConfig,
  isCommentsView,
  currentQuestion,
  progressLabel,
  saving,
  onScoreChange,
  onCommentsChange,
  onNext,
  onPrevious,
  onSubmit,
  onQuestionSelect,
  onCommentsSelect,
}: EvaluationActivePageStageProps) {
  return (
    <div
      className="min-h-screen w-full h-screen px-0 flex flex-col"
      style={evaluateHeaderStyle}
    >
      <EvaluationActiveHeader
        applicantName={formData.applicant.name}
        appLogoUrl={appLogoUrl}
        textColor={evaluateHeaderTextColor}
        onBack={onBack}
      />

      <FileViewerModal
        isOpen={fileViewerOpen}
        onOpenChange={onFileViewerOpenChange}
        file={selectedFile}
      />

      {successModalOpen && (
        <EvaluationWaitingPage
          applicantId={applicantId}
          interviewers={interviewers}
          allEvaluations={allEvaluations}
          onEvaluationsUpdate={onEvaluationsUpdate}
          onSkip={onSkipWaiting}
          onAllCompleted={onAllCompleted}
        />
      )}

      {showForm && (
        <EvaluationActiveForm
          isMobile={isMobile}
          formData={formData}
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
      )}
    </div>
  );
}
