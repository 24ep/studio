"use client";

import { UsersIcon as Users } from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AveragedEvaluationData, EvaluationRecord } from '../types';

interface ReportEvaluatorsProps {
  averagedEvaluationData: AveragedEvaluationData | null;
  allEvaluations: EvaluationRecord[];
}

export function ReportEvaluators({
  averagedEvaluationData,
  allEvaluations,
}: ReportEvaluatorsProps) {
  if (!averagedEvaluationData || allEvaluations.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">
            {averagedEvaluationData.evaluatorCount} {averagedEvaluationData.evaluatorCount === 1 ? 'Evaluator' : 'Evaluators'}
          </span>
        </div>
        <span className="text-gray-400">|</span>
        <div className="flex items-center gap-3 flex-wrap">
          {Array.from(new Map(allEvaluations.map(evaluation => [evaluation.evaluator?.id, evaluation.evaluator])).values())
            .filter(evaluator => evaluator)
            .map((evaluator, index) => (
              <div key={evaluator?.id || index} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={evaluator?.avatarUrl || evaluator?.image || undefined} alt={evaluator?.name || ''} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                    {evaluator?.name?.charAt(0)?.toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 font-medium">{evaluator?.name || 'Unknown'}</span>
                  {evaluator?.positionTitle && (
                    <span className="text-xs text-gray-500">{evaluator.positionTitle}</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
