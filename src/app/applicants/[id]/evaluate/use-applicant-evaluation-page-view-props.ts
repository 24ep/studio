import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useIsDesktop, useIsMobile } from '@/hooks/use-mobile';

import type { EvaluationPageViewProps } from './evaluation-page-view-types';
import { useEvaluationAdminActions } from './use-evaluation-admin-actions';
import { useEvaluationPersonalityAutosave, useEvaluationTestingResultsAutosave } from './use-evaluation-autosave';
import { useEvaluationFormInteractions } from './use-evaluation-form-interactions';
import { useEvaluationSubmitAction } from './use-evaluation-submit-action';
import { useApplicantEvaluationPageViewActions } from './use-applicant-evaluation-page-view-actions';
import { useApplicantEvaluationPageState } from './use-applicant-evaluation-page-state';
import { buildApplicantEvaluationPageViewProps } from './applicant-evaluation-page-view-props-builder';
import { useApplicantEvaluationPageDataRuntime } from './use-applicant-evaluation-page-data-runtime';

export function useApplicantEvaluationPageViewProps(): EvaluationPageViewProps {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const applicantId = params.id as string;

  const pageState = useApplicantEvaluationPageState();
  const {
    formData,
    setFormData,
    setSaving,
    setShowForm,
    testingResults,
    setTestingResults,
    interviewers,
    positionId,
    setAllEvaluations,
    selectedInterviewerId,
    setReportDrawerOpen,
    setSuccessModalOpen,
    setRemarkSectionVisible,
    testingResultsRef,
  } = pageState;

  const evaluationRuntime = useApplicantEvaluationPageDataRuntime({
    applicantId,
    pageState,
    searchParams,
    sessionUser: session?.user,
    sessionStatus: status,
    navigateToSignIn: router.push,
    replaceUrl: router.replace,
  });
  const {
    applySavedEvaluation,
    attachmentState,
    fetchEvaluationData,
    fetchExistingEvaluation,
    handleInterviewerSelect,
    linkStatus,
    permissions,
    remarkAutosave,
    handleRemarkChange,
    handleFileSelect,
    handleFileViewerOpenChange,
    themeSettings,
    canResetEvaluation,
    canRemoveInterviewer,
  } = evaluationRuntime;

  const {
    handleResetEvaluation,
    handleRemoveInterviewer,
    handleRemoveTestResult,
  } = useEvaluationAdminActions({
    applicantId,
    positionId,
    testingResults,
    setTestingResults,
    refreshEvaluationData: fetchEvaluationData,
  });

  const { triggerAutoSave } = useEvaluationPersonalityAutosave({
    applicantId,
    formData,
    testingResults,
    selectedInterviewerId,
    setSaving,
    onSavedEvaluation: applySavedEvaluation,
  });

  const { triggerTestingResultsAutoSave } = useEvaluationTestingResultsAutosave({
    applicantId,
    formData,
    selectedInterviewerId,
    testingResultsRef,
    onSavedEvaluation: async (savedEvaluation) => {
      applySavedEvaluation(savedEvaluation);
      await fetchExistingEvaluation();
    },
  });

  const handleSubmitEvaluation = useEvaluationSubmitAction({
    applicantId,
    formData,
    testingResults,
    interviewers,
    setSaving,
    applySavedEvaluation,
    refreshExistingEvaluation: fetchExistingEvaluation,
    setSuccessModalOpen,
    navigateToResult: () => router.push(`/applicants/${applicantId}/evaluate-result`),
  });

  const {
    handleScoreChange,
    handleCommentsChange,
    handlePrevious,
    handleNext,
    updateTestingResultScore,
  } = useEvaluationFormInteractions({
    formData,
    setFormData,
    setTestingResults,
    testingResultsRef,
    triggerAutoSave,
    triggerTestingResultsAutoSave,
  });

  const viewActions = useApplicantEvaluationPageViewActions({
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
  });

  return buildApplicantEvaluationPageViewProps({
    applicantId,
    isDesktop,
    isMobile,
    pageState,
    linkStatus,
    themeSettings,
    attachmentState,
    permissions,
    remarkAutosave,
    searchParams,
    status,
    viewActions,
  });
}
