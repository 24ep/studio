import type { ApplicantEvaluationDetailRouteContext } from './applicant-evaluation-detail-schema';

export async function resolveEvaluationDetailParams(context: ApplicantEvaluationDetailRouteContext) {
  return context.params;
}
