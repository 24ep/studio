export function buildEvaluateSignInUrl(callbackUrl: string) {
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function buildEvaluatePageCallbackUrl(applicantId: string, token?: string | null) {
  const baseUrl = `/applicants/${applicantId}/evaluate`;
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
}

export function buildEvaluateApplicantUrl(applicantId: string, token?: string | null) {
  return token
    ? `/api/applicants/${applicantId}?token=${encodeURIComponent(token)}`
    : `/api/applicants/${applicantId}`;
}

export function buildEvaluatePositionCriteriaUrl(positionId: string, token?: string | null) {
  return token
    ? `/api/v1/positions/${positionId}/evaluation?token=${encodeURIComponent(token)}`
    : `/api/v1/positions/${positionId}/evaluation`;
}
