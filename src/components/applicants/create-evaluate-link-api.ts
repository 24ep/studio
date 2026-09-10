import { readJsonOrFallback } from '../../lib/response-json';
import {
  getArrayProperty,
  getEvaluationLinkErrorMessage,
  isEvaluationLinkResponse,
  parseCreateEvaluateLinkAzureRooms,
  parseCreateEvaluateLinkInterviewers,
  parseCreateEvaluateLinkUsers,
  type EvaluationLinkResponse,
} from './create-evaluate-link-api-parsers';
import {
  type AzureMeetingRoom,
  type Interviewer,
  type User,
  hasEvaluationSkills,
  normalizeInterviewInvitationTemplateSettings,
} from './create-evaluate-link-utils';

type CreateEvaluateLinkFetcher = typeof fetch;

type CreateEvaluateLinkEmailTemplateSettings = ReturnType<typeof normalizeInterviewInvitationTemplateSettings>;

export interface CreateEvaluateLinkPositionValidation {
  hasInterviewers: boolean;
  hasSkills: boolean;
  interviewers: Interviewer[];
}

export function getDefaultCreateEvaluateLinkEmailTemplate(): CreateEvaluateLinkEmailTemplateSettings {
  return normalizeInterviewInvitationTemplateSettings({});
}

export async function fetchCreateEvaluateLinkPositionValidation(
  positionId: string,
  fetcher: CreateEvaluateLinkFetcher = fetch
): Promise<CreateEvaluateLinkPositionValidation> {
  const [interviewersResponse, evaluationResponse] = await Promise.all([
    fetcher(`/api/positions/${positionId}/interviewers`, { credentials: 'include' }),
    fetcher(`/api/v1/positions/${positionId}/evaluation`, { credentials: 'include' }),
  ]);

  let interviewers: Interviewer[] = [];
  if (interviewersResponse.ok) {
    const interviewersData = await readJsonOrFallback<unknown>(interviewersResponse, []);
    interviewers = parseCreateEvaluateLinkInterviewers(interviewersData);
  }

  let hasSkills = false;
  if (evaluationResponse.ok) {
    hasSkills = hasEvaluationSkills(await readJsonOrFallback<unknown>(evaluationResponse, {}));
  }

  return {
    hasInterviewers: interviewers.length > 0,
    hasSkills,
    interviewers,
  };
}

export async function fetchCreateEvaluateLinkAvailableUsers(
  fetcher: CreateEvaluateLinkFetcher = fetch
): Promise<User[]> {
  const response = await fetcher('/api/users?pageSize=9999', { credentials: 'include' });
  if (!response.ok) return [];

  const data = await readJsonOrFallback<unknown>(response, {});
  return parseCreateEvaluateLinkUsers(data);
}

export async function fetchCreateEvaluateLinkEmailTemplate(
  fetcher: CreateEvaluateLinkFetcher = fetch
): Promise<CreateEvaluateLinkEmailTemplateSettings> {
  const response = await fetcher('/api/settings/system-settings?keys=emailTemplateInterviewInvitationSubject,emailTemplateInterviewInvitation,emailTemplateInterviewInvitationEditorMode,qrCodeLogo,appLogoDataUrl', { credentials: 'include' });
  if (!response.ok) {
    return getDefaultCreateEvaluateLinkEmailTemplate();
  }

  return normalizeInterviewInvitationTemplateSettings(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchCreateEvaluateLinkAzureRooms(
  fetcher: CreateEvaluateLinkFetcher = fetch
): Promise<AzureMeetingRoom[]> {
  const response = await fetcher('/api/azure/meeting-rooms', { credentials: 'include' });
  if (!response.ok) return [];

  const data = await readJsonOrFallback<unknown>(response, {});
  return parseCreateEvaluateLinkAzureRooms(data);
}

export async function addCreateEvaluateLinkInterviewers({
  positionId,
  userIds,
  fetcher = fetch,
}: {
  positionId: string;
  userIds: string[];
  fetcher?: CreateEvaluateLinkFetcher;
}) {
  let successCount = 0;

  for (const userId of userIds) {
    const response = await fetcher(`/api/positions/${positionId}/interviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (response.ok) {
      successCount++;
    }
  }

  return successCount;
}

export async function createApplicantEvaluationLink({
  applicantId,
  payload,
  fetcher = fetch,
}: {
  applicantId: string;
  payload: unknown;
  fetcher?: CreateEvaluateLinkFetcher;
}): Promise<EvaluationLinkResponse> {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluation-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await readJsonOrFallback<unknown>(response, {});
  if (!response.ok) {
    throw new Error(getEvaluationLinkErrorMessage(data));
  }

  if (!isEvaluationLinkResponse(data)) {
    throw new Error('Failed to create evaluation link');
  }

  return data;
}

export async function sendCreateEvaluateLinkInvitationEmails({
  applicantId,
  payload,
  fetcher = fetch,
}: {
  applicantId: string;
  payload: unknown;
  fetcher?: CreateEvaluateLinkFetcher;
}) {
  const response = await fetcher(`/api/applicants/${applicantId}/send-interview-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { sentCount: 0 };
  }

  const data = await readJsonOrFallback<unknown>(response, {});
  return {
    sentCount: getArrayProperty(data, 'results').length,
  };
}
