import type { useSearchParams } from 'next/navigation';
import { useApplicantEvaluationPageEffects } from './use-applicant-evaluation-page-effects';
import type { useApplicantEvaluationPageState } from './use-applicant-evaluation-page-state';
import { useEvaluationAttachments } from './use-evaluation-attachments';
import { useEvaluationLinkStatus } from './use-evaluation-link-status';
import { useEvaluationPageDataLoader } from './use-evaluation-page-data-loader';
import { useEvaluationPermissions } from './use-evaluation-permissions';
import { useEvaluationRemarkAutosave } from './use-evaluation-remark-autosave';
import { useEvaluationThemeSettings } from './use-evaluation-theme-settings';
import { useExistingEvaluationState } from './use-existing-evaluation-state';

interface UseApplicantEvaluationPageDataRuntimeInput {
  applicantId: string;
  navigateToSignIn: (href: string) => void;
  pageState: ReturnType<typeof useApplicantEvaluationPageState>;
  replaceUrl: (href: string) => void;
  searchParams: ReturnType<typeof useSearchParams>;
  sessionStatus: Parameters<typeof useApplicantEvaluationPageEffects>[0]['sessionStatus'];
  sessionUser: Parameters<typeof useEvaluationPermissions>[0]['sessionUser'];
}

export function useApplicantEvaluationPageDataRuntime({
  applicantId,
  navigateToSignIn,
  pageState,
  replaceUrl,
  searchParams,
  sessionStatus,
  sessionUser,
}: UseApplicantEvaluationPageDataRuntimeInput) {
  const linkStatus = useEvaluationLinkStatus({
    applicantId,
    searchParams,
    sessionUser,
  });

  const remarkAutosave = useEvaluationRemarkAutosave({
    applicantId,
    applicantData: pageState.applicantData,
    setApplicantData: pageState.setApplicantData,
  });

  const attachmentState = useEvaluationAttachments(applicantId);
  const themeSettings = useEvaluationThemeSettings();
  const permissions = useEvaluationPermissions({
    sessionUser,
    applicantRecruiterId: pageState.applicantRecruiterId,
  });

  const {
    applySavedEvaluation,
    applyExistingEvaluationRefreshState,
    handleInterviewerSelect,
  } = useExistingEvaluationState({
    allEvaluations: pageState.allEvaluations,
    selectedInterviewerId: pageState.selectedInterviewerId,
    applicantData: pageState.applicantData,
    setAllEvaluations: pageState.setAllEvaluations,
    setExistingEvaluation: pageState.setExistingEvaluation,
    setSelectedInterviewerId: pageState.setSelectedInterviewerId,
    setRemarkText: remarkAutosave.setRemarkText,
    setTestingResults: pageState.setTestingResults,
    testingResultsRef: pageState.testingResultsRef,
    setFormData: pageState.setFormData,
  });

  const {
    fetchEvaluationData,
    fetchExistingEvaluation,
    fetchPersonalityGroupsConfig,
  } = useEvaluationPageDataLoader({
    applicantId,
    searchParams,
    selectedInterviewerId: pageState.selectedInterviewerId,
    reloadAttachments: attachmentState.reloadAttachments,
    loadEvaluateThemeSettings: themeSettings.loadEvaluateThemeSettings,
    applyExistingEvaluationRefreshState,
    navigateToSignIn,
    setApplicantData: pageState.setApplicantData,
    setApplicantRecruiterId: pageState.setApplicantRecruiterId,
    setPositionId: pageState.setPositionId,
    setPositionTitle: pageState.setPositionTitle,
    setAllEvaluations: pageState.setAllEvaluations,
    setTestingResults: pageState.setTestingResults,
    setInterviewers: pageState.setInterviewers,
    setAllDbPositions: pageState.setAllDbPositions,
    setAvailableStages: pageState.setAvailableStages,
    setAvailableRecruiters: pageState.setAvailableRecruiters,
    setAvailableSources: pageState.setAvailableSources,
    setPersonalityGroupsConfig: pageState.setPersonalityGroupsConfig,
    setFormData: pageState.setFormData,
    setLoading: pageState.setLoading,
    setLoadingEvaluation: pageState.setLoadingEvaluation,
    setError: pageState.setError,
  });

  useApplicantEvaluationPageEffects({
    applicantId,
    searchParams,
    sessionStatus,
    hasToken: linkStatus.hasToken,
    evaluationLinkRequireLogin: linkStatus.evaluationLinkRequireLogin,
    loading: pageState.loading,
    loadingEvaluation: pageState.loadingEvaluation,
    selectedInterviewerId: pageState.selectedInterviewerId,
    interviewers: pageState.interviewers,
    formData: pageState.formData,
    showForm: pageState.showForm,
    fetchEvaluationData,
    fetchExistingEvaluation,
    fetchPersonalityGroupsConfig,
    navigateToSignIn,
    replaceUrl,
    setFormData: pageState.setFormData,
    setShowForm: pageState.setShowForm,
    setSelectedInterviewerId: pageState.setSelectedInterviewerId,
  });

  return {
    applySavedEvaluation,
    attachmentState,
    canRemoveInterviewer: permissions.canRemoveInterviewer,
    canResetEvaluation: permissions.canResetEvaluation,
    fetchEvaluationData,
    fetchExistingEvaluation,
    handleFileSelect: attachmentState.handleFileSelect,
    handleFileViewerOpenChange: attachmentState.handleFileViewerOpenChange,
    handleInterviewerSelect,
    handleRemarkChange: remarkAutosave.handleRemarkChange,
    linkStatus,
    permissions,
    remarkAutosave,
    setRemarkText: remarkAutosave.setRemarkText,
    themeSettings,
  };
}
