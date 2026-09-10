import {
  getEvaluationWaitingProgressPercent,
  getEvaluationWaitingRemainingLabel,
} from './evaluation-waiting-utils';

interface EvaluationWaitingProgressProps {
  completedCount: number;
  totalCount: number;
}

export function EvaluationWaitingProgress({
  completedCount,
  totalCount,
}: EvaluationWaitingProgressProps) {
  const progressPercent = getEvaluationWaitingProgressPercent(completedCount, totalCount);

  return (
    <div className="w-full bg-muted/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span className="text-2xl font-bold text-primary">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        {getEvaluationWaitingRemainingLabel(completedCount, totalCount)}
      </p>
    </div>
  );
}
