import type { EvaluationApplicantLike, EvaluationAttachment, EvaluationSummary, Interviewer } from './types';

export interface EvaluateThemeStyle {
  evaluateHeaderBackgroundType: 'image' | 'gradient' | 'solid';
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string | null;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
}

export interface DesktopApplicantInfoProps {
  applicantData: EvaluationApplicantLike | null;
  attachments: EvaluationAttachment[];
  onAttachmentPreview: (attachment: EvaluationAttachment) => void;
}

export interface DesktopInterviewerTabsProps {
  interviewers: Interviewer[];
  allEvaluations: Map<string, EvaluationSummary>;
  selectedInterviewerId: string | null;
  positionTitle: string | null;
  canResetEvaluation: boolean;
  canRemoveInterviewer: boolean;
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
  onInterviewerSelect: (id: string) => void;
  onResetEvaluation?: (interviewerId: string, evaluationId: string) => void;
  onRemoveInterviewer?: (interviewerId: string) => void;
}

export interface DesktopFloatingActionsProps extends EvaluateThemeStyle {
  allEvaluationsComplete: boolean;
  canEditRemark: boolean;
  remarkText: string;
  onReportClick: () => void;
  onRemarkClick: () => void;
}
