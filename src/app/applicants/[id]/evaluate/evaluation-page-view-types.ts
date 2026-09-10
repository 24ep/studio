import type React from "react";

import type { EvaluatePageJobAppliedOptions } from "./evaluate-page-preferences-utils";
import type {
  EvaluationAttachment,
  EvaluationAttachmentPreview,
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
  Interviewer,
  TestingResult,
} from "./types";

export type EvaluationSearchParamsLike = {
  get: (key: string) => string | null;
};

export interface EvaluationPageViewProps {
  applicantId: string;
  applicantData: EvaluationFormData["applicant"] | null;
  formData: EvaluationFormData | null;
  loading: boolean;
  error: string | null;
  linkExpired: boolean;
  canReactivateLink: boolean;
  appLogoUrl: string | null;
  sidebarBgColor: string;
  evaluateHeaderStyle: React.CSSProperties;
  evaluateHeaderBackgroundType: "image" | "gradient" | "solid";
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string | null;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
  isDesktop: boolean;
  isMobile: boolean;
  showForm: boolean;
  attachments: EvaluationAttachment[];
  testingResults: TestingResult[];
  interviewers: Interviewer[];
  allEvaluations: Map<string, EvaluationSummary>;
  selectedInterviewerId: string | null;
  canRemoveInterviewer: boolean;
  canEditRemark: boolean;
  canEditScores: boolean;
  canResetEvaluation: boolean;
  positionId: string | null;
  positionTitle: string | null;
  remarkText: string;
  allDbPositions: EvaluatePageJobAppliedOptions["positions"];
  availableStages: EvaluatePageJobAppliedOptions["stages"];
  availableRecruiters: EvaluatePageJobAppliedOptions["recruiters"];
  availableSources: EvaluatePageJobAppliedOptions["sources"];
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
  interviewerNameColor: string;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  searchParams: EvaluationSearchParamsLike;
  testingResultsRef: React.MutableRefObject<TestingResult[]>;
  hasToken: boolean;
  evaluationLinkRequireLogin: boolean | null;
  status: string;
  existingEvaluation: EvaluationSummary | null;
  remarkSectionVisible: boolean;
  savingRemark: boolean;
  remarkSaved: boolean;
  reportDrawerOpen: boolean;
  fileViewerOpen: boolean;
  selectedFile: EvaluationAttachmentPreview | null;
  successModalOpen: boolean;
  lineStyle: { left: string; width: string } | null;
  skillsListRef: React.RefObject<HTMLDivElement>;
  saving: boolean;
  onErrorBack: () => void;
  onBackToApplicants: () => void;
  onConfigureEvaluation: (targetPositionId: string) => void;
  onInterviewerSelect: (id: string, evaluation: EvaluationSummary | null) => void;
  onTestingResultScoreChange: (index: number, newScore: number, shouldAutosave?: boolean) => void;
  onTestingResultRemove: (index: number) => void;
  onBackToInterview: () => void;
  onRemarkChange: (text: string, event?: React.ChangeEvent<HTMLTextAreaElement>, debounceMs?: number) => void;
  onRefreshEvaluation: () => void;
  onStartEvaluate: (traitId?: string) => void;
  onResetEvaluation: (interviewerId: string, evaluationId: string) => void;
  onRemoveInterviewer: (interviewerId: string) => void;
  onFileSelect: (file: EvaluationAttachmentPreview) => void;
  onTestingResultsBlur: () => void;
  onStartMobileEvaluation: () => void;
  onTraitClick: (traitId: string) => void;
  onReportClick: () => void;
  onCloseRemark: () => void;
  onFileViewerOpenChange: (open: boolean) => void;
  onReportDrawerOpenChange: (open: boolean) => void;
  onOpenReportInNewPage: () => void;
  onEvaluationsUpdate: (evaluations: Map<string, EvaluationSummary>) => void;
  onSkipWaiting: () => void;
  onAllCompleted: () => void;
  onActiveBack: () => void;
  onScoreChange: (questionId: string, score: number) => void;
  onCommentsChange: (comments: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onQuestionSelect: (index: number) => void;
  onCommentsSelect: () => void;
}

export type LoadedEvaluationPageViewProps = EvaluationPageViewProps & {
  formData: EvaluationFormData;
};
