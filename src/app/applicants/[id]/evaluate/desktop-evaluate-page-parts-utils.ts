import type { CSSProperties } from 'react';
import type { EvaluationApplicantLike, EvaluationAttachment, Interviewer } from './types';

export interface DesktopEvaluateInterviewerStyleInput {
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
}

export function getDesktopEvaluateAttachmentName(attachment?: EvaluationAttachment | null) {
  return attachment?.filename ||
    attachment?.fileName ||
    attachment?.name ||
    attachment?.originalName ||
    'Attachment';
}

export function getDesktopEvaluateAttachmentFileName(attachment?: EvaluationAttachment | null) {
  return attachment?.fileName || 'Attachment';
}

export function getDesktopEvaluateAttachmentLabel(attachment?: EvaluationAttachment | null) {
  return attachment?.label || 'PDF';
}

export function getDesktopEvaluateAiEvaluationItems(applicantData?: EvaluationApplicantLike | null): string[] {
  const raw = applicantData?.assignmentJustification || applicantData?.aiEvaluation;

  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof raw === 'string') {
    return raw.split('\n').map((item: string) => item.trim()).filter(Boolean);
  }

  return [];
}

export function buildDesktopEvaluateInterviewerStyle(
  input: DesktopEvaluateInterviewerStyleInput,
  isSelected: boolean
): CSSProperties {
  if (isSelected) {
    return {
      ...(input.interviewerSelectedBgColor.includes('gradient')
        ? { background: input.interviewerSelectedBgColor }
        : { backgroundColor: `hsl(${input.interviewerSelectedBgColor})` }),
      color: `hsl(${input.interviewerSelectedTextColor})`,
      borderColor: `hsl(${input.interviewerSelectedBorderColor})`,
      borderWidth: input.interviewerSelectedBorderWidth,
      borderStyle: 'solid',
    };
  }

  return {
    backgroundColor: `hsl(${input.interviewerNonSelectedBgColor})`,
    color: `hsl(${input.interviewerNonSelectedTextColor})`,
    borderColor: `hsl(${input.interviewerNonSelectedBorderColor})`,
    borderWidth: input.interviewerNonSelectedBorderWidth,
    borderStyle: 'solid',
  };
}

export function shouldShowDesktopEvaluateInterviewerMenu({
  canResetEvaluation,
  canRemoveInterviewer,
  hasEvaluation,
}: {
  canResetEvaluation: boolean;
  canRemoveInterviewer: boolean;
  hasEvaluation: boolean;
}) {
  return (canResetEvaluation && hasEvaluation) || canRemoveInterviewer;
}

export function shouldShowDesktopEvaluateInterviewerMenuSeparator({
  canResetEvaluation,
  canRemoveInterviewer,
  hasEvaluation,
}: {
  canResetEvaluation: boolean;
  canRemoveInterviewer: boolean;
  hasEvaluation: boolean;
}) {
  return canResetEvaluation && hasEvaluation && canRemoveInterviewer;
}

export function getDesktopEvaluateInterviewerPositionTitle(
  interviewer: Partial<Pick<Interviewer, 'positionTitle'>>,
  fallbackPositionTitle?: string | null
) {
  return interviewer?.positionTitle || fallbackPositionTitle || '';
}

export function getDesktopEvaluateInterviewerFallbackName(interviewer: Partial<Pick<Interviewer, 'userName'>>) {
  return interviewer?.userName?.charAt(0) || '';
}

export function getDesktopEvaluateRemarkDisplayText(remarkText?: string | null) {
  return remarkText?.trim() ? remarkText : 'Remark to interviewer';
}

export function getDesktopEvaluateRemarkButtonClassName(canEditRemark: boolean) {
  const baseClassName = 'max-w-[360px] w-full sm:w-[340px] rounded-full shadow-lg px-4 py-3 flex items-start gap-3 text-left h-auto min-h-[56px] bg-white hover:bg-gray-50 text-gray-900 border-gray-200';
  return canEditRemark
    ? baseClassName
    : `${baseClassName} opacity-80 cursor-not-allowed`;
}
