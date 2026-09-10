"use client";

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon as ArrowLeft,
  CheckCircleIcon as CheckCircle,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

import {
  EvaluationWaitingAnimationStyles,
  EvaluationWaitingBackground,
  EvaluationWaitingWaveDots,
} from './EvaluationWaitingAnimations';
import { EvaluationWaitingInterviewerList } from './EvaluationWaitingInterviewerList';
import { EvaluationWaitingProgress } from './EvaluationWaitingProgress';
import type {
  EvaluationWaitingInterviewer,
  WaitingEvaluation,
} from './evaluation-waiting-types';
import { useEvaluationWaitingPoller } from './use-evaluation-waiting-poller';

interface EvaluationWaitingPageProps {
  applicantId: string;
  interviewers: EvaluationWaitingInterviewer[];
  allEvaluations: Map<string, WaitingEvaluation>;
  onSkip: () => void;
  onAllCompleted: () => void;
  onEvaluationsUpdate?: (evaluations: Map<string, WaitingEvaluation>) => void;
}

export function EvaluationWaitingPage({
  applicantId,
  interviewers,
  allEvaluations,
  onSkip,
  onAllCompleted,
  onEvaluationsUpdate,
}: EvaluationWaitingPageProps) {
  const router = useRouter();

  const navigateToResult = useCallback(() => {
    router.push(`/applicants/${applicantId}/evaluate-result`);
  }, [applicantId, router]);

  const {
    completedCount,
    currentEvaluations,
    totalCount,
  } = useEvaluationWaitingPoller({
    applicantId,
    interviewers,
    initialEvaluations: allEvaluations,
    onAllCompleted,
    onCompletedNavigate: navigateToResult,
    onEvaluationsUpdate,
  });

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden">
      <EvaluationWaitingBackground />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-md">
        <div className="mb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-green-500 flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Evaluation Submitted!</h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6">
          Waiting for other interviewers to complete their evaluations...
        </p>

        <EvaluationWaitingProgress
          completedCount={completedCount}
          totalCount={totalCount}
        />

        <EvaluationWaitingWaveDots />

        <EvaluationWaitingInterviewerList
          evaluations={currentEvaluations}
          interviewers={interviewers}
        />

        <Button
          variant="outline"
          onClick={onSkip}
          className="flex items-center gap-2"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5" />
          Skip Waiting & Back to Evaluate
        </Button>
      </div>

      <EvaluationWaitingAnimationStyles />
    </div>
  );
}

