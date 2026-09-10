import { type NextRequest } from 'next/server';
import { readRequestJsonObject } from '@/lib/request-json';
import {
  createEvaluationLinkSchema,
  type ApplicantEvaluationLinkRouteContext,
  type UpdateEvaluationLinkInput,
} from './applicant-evaluation-link-schema';

export async function resolveEvaluationLinkApplicantId(context: ApplicantEvaluationLinkRouteContext) {
  return (await context.params).id;
}

export async function parseCreateEvaluationLinkBody(request: NextRequest) {
  const body = await readRequestJsonObject(request);
  const parsed = createEvaluationLinkSchema.parse(body);
  return {
    days: parsed.days ?? 7,
    force: parsed.force ?? false,
    requireLogin: parsed.requireLogin ?? true,
    interviewDateTime: parsed.interviewDateTime,
    interviewLocation: parsed.interviewLocation,
  };
}

export async function parseUpdateEvaluationLinkBody(request: NextRequest): Promise<UpdateEvaluationLinkInput> {
  return readRequestJsonObject(request);
}
