import type { useSearchParams } from 'next/navigation';
import type { EvaluationPageViewProps } from './evaluation-page-view-types';
import type { useApplicantEvaluationPageState } from './use-applicant-evaluation-page-state';
import type { useApplicantEvaluationPageViewActions } from './use-applicant-evaluation-page-view-actions';
import type { useEvaluationAttachments } from './use-evaluation-attachments';
import type { useEvaluationLinkStatus } from './use-evaluation-link-status';
import type { useEvaluationPermissions } from './use-evaluation-permissions';
import type { useEvaluationRemarkAutosave } from './use-evaluation-remark-autosave';
import type { useEvaluationThemeSettings } from './use-evaluation-theme-settings';

interface BuildApplicantEvaluationPageViewPropsInput {
  applicantId: string;
  attachmentState: ReturnType<typeof useEvaluationAttachments>;
  isDesktop: boolean;
  isMobile: boolean;
  linkStatus: ReturnType<typeof useEvaluationLinkStatus>;
  pageState: ReturnType<typeof useApplicantEvaluationPageState>;
  permissions: ReturnType<typeof useEvaluationPermissions>;
  remarkAutosave: ReturnType<typeof useEvaluationRemarkAutosave>;
  searchParams: ReturnType<typeof useSearchParams>;
  status: string;
  themeSettings: ReturnType<typeof useEvaluationThemeSettings>;
  viewActions: ReturnType<typeof useApplicantEvaluationPageViewActions>;
}

export function buildApplicantEvaluationPageViewProps({
  applicantId,
  attachmentState,
  isDesktop,
  isMobile,
  linkStatus,
  pageState,
  permissions,
  remarkAutosave,
  searchParams,
  status,
  themeSettings,
  viewActions,
}: BuildApplicantEvaluationPageViewPropsInput): EvaluationPageViewProps {
  return {
    applicantId,
    applicantData: pageState.applicantData,
    formData: pageState.formData,
    loading: pageState.loading,
    error: pageState.error,
    ...linkStatus,
    ...themeSettings,
    isDesktop,
    isMobile,
    showForm: pageState.showForm,
    attachments: attachmentState.attachments,
    testingResults: pageState.testingResults,
    interviewers: pageState.interviewers,
    allEvaluations: pageState.allEvaluations,
    selectedInterviewerId: pageState.selectedInterviewerId,
    ...permissions,
    positionId: pageState.positionId,
    positionTitle: pageState.positionTitle,
    remarkText: remarkAutosave.remarkText,
    allDbPositions: pageState.allDbPositions,
    availableStages: pageState.availableStages,
    availableRecruiters: pageState.availableRecruiters,
    availableSources: pageState.availableSources,
    personalityGroupsConfig: pageState.personalityGroupsConfig,
    searchParams,
    testingResultsRef: pageState.testingResultsRef,
    hasToken: linkStatus.hasToken,
    evaluationLinkRequireLogin: linkStatus.evaluationLinkRequireLogin,
    status,
    existingEvaluation: pageState.existingEvaluation,
    remarkSectionVisible: pageState.remarkSectionVisible,
    savingRemark: remarkAutosave.savingRemark,
    remarkSaved: remarkAutosave.remarkSaved,
    reportDrawerOpen: pageState.reportDrawerOpen,
    fileViewerOpen: attachmentState.fileViewerOpen,
    selectedFile: attachmentState.selectedFile,
    successModalOpen: pageState.successModalOpen,
    lineStyle: pageState.lineStyle,
    skillsListRef: pageState.skillsListRef,
    saving: pageState.saving,
    ...viewActions,
  };
}
