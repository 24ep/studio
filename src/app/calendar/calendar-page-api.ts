import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonString,
  isJsonObject,
  readJsonObject,
  readJsonOrFallback,
} from '../../lib/response-json';
import {
  normalizeEvaluationLinks,
  type ApplicantReminder,
  type ApplicantWithEvaluationLink,
} from './calendar-page-utils';

function getCalendarLogoUrl(data: Awaited<ReturnType<typeof readJsonObject>>) {
  return getJsonString(data, 'qrCodeLogo') ?? getJsonString(data, 'appLogoDataUrl') ?? null;
}

function normalizeCalendarReminders(data: Awaited<ReturnType<typeof readJsonObject>>): ApplicantReminder[] {
  return (getJsonArray(data, 'data') ?? []).flatMap((item) => {
    if (!isJsonObject(item)) {
      return [];
    }

    const id = getJsonString(item, 'id');
    const applicantId = getJsonString(item, 'applicantId');
    const title = getJsonString(item, 'title');
    const reminderDate = getJsonString(item, 'reminderDate');
    const applicant = isJsonObject(item.applicant) ? item.applicant : null;
    const applicantName = applicant ? getJsonString(applicant, 'name') : undefined;
    if (!id || !applicantId || !title || !reminderDate || !applicant || !applicantName) {
      return [];
    }

    const position = isJsonObject(applicant.position) ? applicant.position : null;
    return [{
      id,
      applicantId,
      title,
      content: getJsonString(item, 'content') ?? null,
      reminderDate,
      isCompleted: item.isCompleted === true,
      applicant: {
        id: getJsonString(applicant, 'id') ?? applicantId,
        name: applicantName,
        position: position ? { title: getJsonString(position, 'title') ?? '' } : null,
      },
    }];
  });
}

async function getEvaluationLinksErrorMessage(response: Response) {
  const errorData = await readJsonObject(response);
  const payloadMessage = getJsonErrorMessage(errorData, '');
  const hint = getJsonString(errorData, 'hint');
  if (payloadMessage) {
    return hint ? `${payloadMessage} - ${hint}` : payloadMessage;
  }

  if (response.status === 401) {
    return 'Unauthorized. Please log in to view evaluation links.';
  }
  if (response.status === 403) {
    return 'You do not have permission to view evaluation links.';
  }
  if (response.status === 500) {
    return 'Server error. Please try again later.';
  }

  return 'Failed to fetch Applicants with evaluation links';
}

export async function fetchCalendarReminders(): Promise<ApplicantReminder[]> {
  const response = await fetch('/api/reminders', { credentials: 'include' });
  if (!response.ok) {
    return [];
  }

  return normalizeCalendarReminders(await readJsonObject(response));
}

export async function fetchCalendarLogoUrl(): Promise<string | null> {
  const response = await fetch('/api/settings/system-settings?keys=qrCodeLogo,appLogoDataUrl');
  if (!response.ok) {
    return null;
  }

  return getCalendarLogoUrl(await readJsonObject(response));
}

export async function fetchCalendarApplicantsWithEvaluationLinks(
  query?: string | null,
): Promise<ApplicantWithEvaluationLink[]> {
  const queryString = query ? `&q=${encodeURIComponent(query)}` : '';
  const response = await fetch(`/api/v1/evaluation/links?status=all&limit=100${queryString}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await getEvaluationLinksErrorMessage(response));
  }

  return normalizeEvaluationLinks(await readJsonOrFallback<unknown>(response, {}));
}

export async function scheduleCalendarApplicantInterview(
  applicantId: string,
  interviewDateTime: string,
): Promise<void> {
  const response = await fetch(`/api/v1/applicants/${encodeURIComponent(applicantId)}/evaluation-link`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days: 7, interviewDateTime }),
  });

  if (!response.ok) {
    const payload = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(payload, 'Failed to schedule interview'));
  }
}
