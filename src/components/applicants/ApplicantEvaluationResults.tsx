"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
} from '@heroicons/react/24/outline';
import {
  formatPersonalityScore,
  type ApplicantEvaluationData,
  type AveragedApplicantEvaluationData,
} from './applicant-evaluation-modal-api';

export function EvaluationResults({
  averagedEvaluationData,
  evaluationData,
}: {
  averagedEvaluationData: AveragedApplicantEvaluationData | null;
  evaluationData: ApplicantEvaluationData | null;
}) {
  if (!averagedEvaluationData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No evaluation has been completed yet. Click "Start Evaluation" to begin the personality assessment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Overall Score
            {averagedEvaluationData.evaluatorCount > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Average from {averagedEvaluationData.evaluatorCount} interviewers)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatPersonalityScore(averagedEvaluationData.overallScore)}/5 ({Math.round(averagedEvaluationData.overallScore * 20)}%)
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {averagedEvaluationData.personalityScores.map((score, index) => (
          <PersonalityScoreCircle key={score.trait.id || index} score={score} />
        ))}
      </div>

      {evaluationData?.comments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">{evaluationData.comments}</p>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Remark to interviewer: {evaluationData.comments}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PersonalityScoreCircle({
  score,
}: {
  score: AveragedApplicantEvaluationData['personalityScores'][number];
}) {
  const scoreColor = score.averageScore >= 4 ? 'text-green-600 border-green-200 bg-green-50' :
    score.averageScore >= 3 ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
      'text-red-600 border-red-200 bg-red-50';

  return (
    <div className="text-center group relative" title={score.trait.description}>
      <div className="relative w-24 h-24 mx-auto mb-2">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${scoreColor}`}>
          <div className="text-center">
            <div className="text-xl font-bold">{formatPersonalityScore(score.averageScore)}</div>
            <div className="text-xs opacity-70">/5</div>
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700">{score.trait.name}</div>
      {score.evaluatorCount > 1 && (
        <div className="text-[10px] text-gray-400 mt-1">
          ({score.evaluatorCount})
        </div>
      )}
    </div>
  );
}
