import { getCalendarPayloadList } from './calendar-payload-utils';
import type {
  ApplicantWithEvaluationLink,
  EvaluationLinkPayloadItem,
  SearchApplicant,
  SearchApplicantPayload,
} from './calendar-page-types';

export function normalizeEvaluationLinks(
  payload: unknown,
): ApplicantWithEvaluationLink[] {
  return getCalendarPayloadList(payload)
    .filter(
      (item): item is EvaluationLinkPayloadItem =>
        !!item &&
        typeof item === 'object' &&
        !!(item as EvaluationLinkPayloadItem).applicant &&
        typeof (item as EvaluationLinkPayloadItem).url === 'string',
    )
    .map((item) => ({
      id: String(item.applicant?.id || ''),
      name:
        typeof item.applicant?.name === 'string'
          ? item.applicant.name
          : 'Unknown',
      email:
        typeof item.applicant?.email === 'string'
          ? item.applicant.email
          : null,
      avatarUrl:
        typeof item.applicant?.avatarUrl === 'string'
          ? item.applicant.avatarUrl
          : null,
      position: item.applicant?.position || null,
      evaluationLink: {
        url: item.url as string,
        expiresAt: typeof item.expiresAt === 'string' ? item.expiresAt : '',
        revokedAt: typeof item.revokedAt === 'string' ? item.revokedAt : null,
        interviewDateTime:
          typeof item.interviewDateTime === 'string'
            ? item.interviewDateTime
            : undefined,
        interviewLocation:
          typeof item.interviewLocation === 'string'
            ? item.interviewLocation
            : undefined,
        interviewers: item.interviewers || undefined,
      },
    }))
    .filter((item) => item.id);
}

export function normalizeSearchApplicants(payload: unknown): SearchApplicant[] {
  return getCalendarPayloadList(payload)
    .filter(
      (item): item is SearchApplicantPayload =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as SearchApplicantPayload).id === 'string',
    )
    .map((item) => ({
      id: item.id as string,
      name: typeof item.name === 'string' ? item.name : 'Unknown',
      email: typeof item.email === 'string' ? item.email : null,
      avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl : null,
      position: item.position || null,
      positionId:
        typeof item.positionId === 'string'
          ? item.positionId
          : item.position?.id || null,
    }));
}
