import { toast } from 'react-hot-toast';

import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type { EvaluationSummary } from './types';
import type { buildEvaluationSavePayload } from './utils';

type EvaluationSavePayload = ReturnType<typeof buildEvaluationSavePayload> & {
  personalityScores?: Array<{ traitId: string; score: number; notes: string }>;
};

interface SaveEvaluationAutosaveInput {
  applicantId: string;
  failureMessage: string;
  logLabel: string;
  onSavedEvaluation: (savedEvaluation: EvaluationSummary) => unknown | Promise<unknown>;
  payload: EvaluationSavePayload;
  showErrorToast?: boolean;
  successMessage: string;
}

export async function saveEvaluationAutosave({
  applicantId,
  failureMessage,
  logLabel,
  onSavedEvaluation,
  payload,
  showErrorToast = true,
  successMessage,
}: SaveEvaluationAutosaveInput) {
  const response = await fetch(`/api/v1/applicants/${applicantId}/evaluation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const savedEvaluation = await readJsonOrFallback<EvaluationSummary>(response, {});
    await onSavedEvaluation(savedEvaluation);
    toast.success(successMessage);
    return;
  }

  const errorData = await readJsonObject(response);
  const errorMessage = getJsonErrorMessage(errorData, failureMessage);
  console.error(logLabel, errorData);

  if (showErrorToast) {
    toast.error(errorMessage);
  }
}
