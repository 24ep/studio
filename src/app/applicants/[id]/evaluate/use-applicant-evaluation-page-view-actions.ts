import type { Dispatch, SetStateAction } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { EvaluationPageViewProps } from './evaluation-page-view-types';
import type { EvaluationFormData, EvaluationSummary } from './types';
import { getEvaluationTraitNavigationUpdate } from './utils';

type EvaluationPageViewActions = Pick<
  EvaluationPageViewProps,
  | 'onErrorBack'
  | 'onBackToApplicants'
  | 'onConfigureEvaluation'
  | 'onInterviewerSelect'
  | 'onTestingResultScoreChange'
  | 'onTestingResultRemove'
  | 'onBackToInterview'
  | 'onRemarkChange'
  | 'onRefreshEvaluation'
  | 'onStartEvaluate'
  | 'onResetEvaluation'
  | 'onRemoveInterviewer'
  | 'onFileSelect'
  | 'onTestingResultsBlur'
  | 'onStartMobileEvaluation'
  | 'onTraitClick'
  | 'onReportClick'
  | 'onCloseRemark'
  | 'onFileViewerOpenChange'
  | 'onReportDrawerOpenChange'
  | 'onOpenReportInNewPage'
  | 'onEvaluationsUpdate'
  | 'onSkipWaiting'
  | 'onAllCompleted'
  | 'onActiveBack'
  | 'onScoreChange'
  | 'onCommentsChange'
  | 'onNext'
  | 'onPrevious'
  | 'onSubmit'
  | 'onQuestionSelect'
  | 'onCommentsSelect'
>;

interface UseApplicantEvaluationPageViewActionsInput {
  applicantId: string;
  formData: EvaluationFormData | null;
  isMobile: boolean;
  router: AppRouterInstance;
  fetchEvaluationData: () => void;
  fetchExistingEvaluation: () => void;
  handleInterviewerSelect: EvaluationPageViewProps['onInterviewerSelect'];
  updateTestingResultScore: EvaluationPageViewProps['onTestingResultScoreChange'];
  handleRemoveTestResult: EvaluationPageViewProps['onTestingResultRemove'];
  handleRemarkChange: EvaluationPageViewProps['onRemarkChange'];
  handleResetEvaluation: EvaluationPageViewProps['onResetEvaluation'];
  handleRemoveInterviewer: EvaluationPageViewProps['onRemoveInterviewer'];
  handleFileSelect: EvaluationPageViewProps['onFileSelect'];
  triggerTestingResultsAutoSave: EvaluationPageViewProps['onTestingResultsBlur'];
  handleFileViewerOpenChange: EvaluationPageViewProps['onFileViewerOpenChange'];
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setReportDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setSuccessModalOpen: Dispatch<SetStateAction<boolean>>;
  setRemarkSectionVisible: Dispatch<SetStateAction<boolean>>;
  setAllEvaluations: Dispatch<SetStateAction<Map<string, EvaluationSummary>>>;
  handleScoreChange: EvaluationPageViewProps['onScoreChange'];
  handleCommentsChange: EvaluationPageViewProps['onCommentsChange'];
  handleNext: EvaluationPageViewProps['onNext'];
  handlePrevious: EvaluationPageViewProps['onPrevious'];
  handleSubmitEvaluation: EvaluationPageViewProps['onSubmit'];
}

export function useApplicantEvaluationPageViewActions({
  applicantId,
  formData,
  isMobile,
  router,
  fetchEvaluationData,
  fetchExistingEvaluation,
  handleInterviewerSelect,
  updateTestingResultScore,
  handleRemoveTestResult,
  handleRemarkChange,
  handleResetEvaluation,
  handleRemoveInterviewer,
  handleFileSelect,
  triggerTestingResultsAutoSave,
  handleFileViewerOpenChange,
  setFormData,
  setShowForm,
  setReportDrawerOpen,
  setSuccessModalOpen,
  setRemarkSectionVisible,
  setAllEvaluations,
  handleScoreChange,
  handleCommentsChange,
  handleNext,
  handlePrevious,
  handleSubmitEvaluation,
}: UseApplicantEvaluationPageViewActionsInput): EvaluationPageViewActions {
  const updateFormNavigation = (traitId?: string) => {
    if (!formData) {
      return;
    }

    const navigationUpdate = getEvaluationTraitNavigationUpdate(formData, traitId);
    if (navigationUpdate) {
      setFormData(navigationUpdate.formData);
    }
  };

  return {
    onErrorBack: () => router.back(),
    onBackToApplicants: () => router.push('/applicants'),
    onConfigureEvaluation: (targetPositionId) => {
      window.open(`/positions/${targetPositionId}?tab=evaluation`, '_blank');
    },
    onInterviewerSelect: handleInterviewerSelect,
    onTestingResultScoreChange: updateTestingResultScore,
    onTestingResultRemove: handleRemoveTestResult,
    onBackToInterview: () => router.push('/calendar'),
    onRemarkChange: handleRemarkChange,
    onRefreshEvaluation: () => {
      fetchEvaluationData();
      fetchExistingEvaluation();
    },
    onStartEvaluate: (traitId) => {
      updateFormNavigation(traitId);
      setShowForm(true);
    },
    onResetEvaluation: handleResetEvaluation,
    onRemoveInterviewer: handleRemoveInterviewer,
    onFileSelect: handleFileSelect,
    onTestingResultsBlur: triggerTestingResultsAutoSave,
    onStartMobileEvaluation: () => {
      handleFileViewerOpenChange(false);
      setShowForm(true);
    },
    onTraitClick: (traitId) => {
      updateFormNavigation(traitId);
      setShowForm(true);
    },
    onReportClick: () => {
      if (isMobile) {
        router.push(`/applicants/${applicantId}/evaluate-result`);
      } else {
        setReportDrawerOpen(true);
      }
    },
    onCloseRemark: () => setRemarkSectionVisible(false),
    onFileViewerOpenChange: handleFileViewerOpenChange,
    onReportDrawerOpenChange: setReportDrawerOpen,
    onOpenReportInNewPage: () => router.push(`/applicants/${applicantId}/evaluate-result`),
    onEvaluationsUpdate: setAllEvaluations,
    onSkipWaiting: () => {
      setSuccessModalOpen(false);
      setShowForm(false);
      window.location.reload();
    },
    onAllCompleted: () => {
      setSuccessModalOpen(false);
      setShowForm(false);
    },
    onActiveBack: () => setShowForm(false),
    onScoreChange: handleScoreChange,
    onCommentsChange: handleCommentsChange,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSubmit: handleSubmitEvaluation,
    onQuestionSelect: (index) => {
      if (formData) {
        setFormData({ ...formData, currentQuestionIndex: index });
      }
      setShowForm(true);
    },
    onCommentsSelect: () => {
      if (formData) {
        setFormData({ ...formData, currentQuestionIndex: formData.questions.length });
      }
    },
  };
}
