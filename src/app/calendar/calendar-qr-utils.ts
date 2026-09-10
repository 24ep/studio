import type {
  ApplicantWithEvaluationLink,
  CalendarEvaluationQrData,
  CreatedEvaluationLinkPayload,
  SearchApplicant,
} from './calendar-page-types';

export function buildCalendarQrDataFromCreatedLink(
  applicant: SearchApplicant,
  linkPayload: CreatedEvaluationLinkPayload,
): CalendarEvaluationQrData | null {
  if (typeof linkPayload.url !== 'string' || !linkPayload.url) {
    return null;
  }

  return {
    name: applicant.name,
    url: linkPayload.url,
    avatarUrl: applicant.avatarUrl || null,
    expiresAt:
      typeof linkPayload.expiresAt === 'string' ? linkPayload.expiresAt : '',
  };
}

export function buildCalendarQrDataFromEvaluationLink(
  applicant: ApplicantWithEvaluationLink,
): CalendarEvaluationQrData | null {
  if (!applicant.evaluationLink?.url) {
    return null;
  }

  return {
    name: applicant.name,
    url: applicant.evaluationLink.url,
    avatarUrl: applicant.avatarUrl,
    expiresAt: applicant.evaluationLink.expiresAt,
  };
}
