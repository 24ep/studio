"use client";

import { Users } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import type { EvaluationFormData, EvaluationSummary, Interviewer } from '../types';

import {
  DesktopInterviewerList,
  MobileInterviewerCarousel,
} from './InterviewerSelectionSectionParts';
import type { InterviewerSelectionStyleInput } from './interviewer-selection-utils';

interface InterviewerSelectionSectionProps extends InterviewerSelectionStyleInput {
  interviewers: Interviewer[];
  selectedInterviewerId: string | null;
  allEvaluations: Map<string, EvaluationSummary>;
  hasToken: boolean;
  evaluationLinkRequireLogin: boolean | null;
  status: string;
  applicantData: EvaluationFormData['applicant'] | null;
  onInterviewerSelect: (interviewerId: string, evaluation: EvaluationSummary | null) => void;
}

export function InterviewerSelectionSection({
  interviewers,
  selectedInterviewerId,
  allEvaluations,
  hasToken,
  evaluationLinkRequireLogin,
  status,
  interviewerSelectedBgColor,
  interviewerSelectedTextColor,
  interviewerSelectedBorderColor,
  interviewerSelectedBorderWidth,
  interviewerNonSelectedBgColor,
  interviewerNonSelectedTextColor,
  interviewerNonSelectedBorderColor,
  interviewerNonSelectedBorderWidth,
  onInterviewerSelect,
}: InterviewerSelectionSectionProps) {
  const styleInput: InterviewerSelectionStyleInput = {
    interviewerSelectedBgColor,
    interviewerSelectedTextColor,
    interviewerSelectedBorderColor,
    interviewerSelectedBorderWidth,
    interviewerNonSelectedBgColor,
    interviewerNonSelectedTextColor,
    interviewerNonSelectedBorderColor,
    interviewerNonSelectedBorderWidth,
  };

  const handleInterviewerClick = (interviewer: Interviewer) => {
    const evaluation = allEvaluations.get(interviewer.userId);
    onInterviewerSelect(interviewer.userId, evaluation || null);
  };

  return (
    <div className="order-1 md:order-none md:col-span-4 md:border-r md:pr-4 md:pr-6">
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Interviewer
      </h3>
      {hasToken && evaluationLinkRequireLogin === true && status !== 'authenticated' && (
        <Alert className="mb-4">
          <AlertDescription className="text-base">
            Please login first to access this evaluation.
          </AlertDescription>
        </Alert>
      )}

      <MobileInterviewerCarousel
        interviewers={interviewers}
        selectedInterviewerId={selectedInterviewerId}
        styleInput={styleInput}
        onInterviewerClick={handleInterviewerClick}
      />
      <DesktopInterviewerList
        interviewers={interviewers}
        selectedInterviewerId={selectedInterviewerId}
        styleInput={styleInput}
        onInterviewerClick={handleInterviewerClick}
      />

      <div className="block md:hidden border-t my-4 -mx-6 sm:-mx-10" />
    </div>
  );
}
