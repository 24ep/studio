import {
  CheckIcon as Check,
  ClockIcon as Clock,
} from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import type {
  EvaluationWaitingInterviewer,
  WaitingEvaluation,
} from './evaluation-waiting-types';
import { isWaitingEvaluationComplete } from './evaluation-waiting-utils';

interface EvaluationWaitingInterviewerListProps {
  interviewers: EvaluationWaitingInterviewer[];
  evaluations: Map<string, WaitingEvaluation>;
}

export function EvaluationWaitingInterviewerList({
  interviewers,
  evaluations,
}: EvaluationWaitingInterviewerListProps) {
  if (interviewers.length === 0) return null;

  return (
    <div className="w-full mb-8 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Interviewer Status
      </h3>
      {interviewers.map(interviewer => (
        <EvaluationWaitingInterviewerRow
          key={interviewer.userId}
          interviewer={interviewer}
          isCompleted={isWaitingEvaluationComplete(evaluations.get(interviewer.userId))}
        />
      ))}
    </div>
  );
}

interface EvaluationWaitingInterviewerRowProps {
  interviewer: EvaluationWaitingInterviewer;
  isCompleted: boolean;
}

function EvaluationWaitingInterviewerRow({
  interviewer,
  isCompleted,
}: EvaluationWaitingInterviewerRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        isCompleted
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          : 'bg-muted/30 border-muted'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={interviewer.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">
          {interviewer.userName?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium">{interviewer.userName}</span>
      {isCompleted ? <CompletedStatus /> : <WaitingStatus />}
    </div>
  );
}

function CompletedStatus() {
  return (
    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
      <Check className="h-4 w-4" />
      <span className="text-xs font-medium">Completed</span>
    </div>
  );
}

function WaitingStatus() {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Clock className="h-4 w-4 animate-pulse" />
      <span className="text-xs">In Evaluation...</span>
    </div>
  );
}
