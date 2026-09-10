import type { ApplicantSettings } from "../components/applicants/applicant-settings-types";
import { mergeApplicantSettings } from "../components/applicants/applicant-settings-drawer-utils";

export const APPLICANT_SETTINGS_REQUEST_TIMEOUT_MS = 10000;
export const APPLICANT_SETTINGS_MAX_RETRIES = 3;

export const DEFAULT_APPLICANT_SETTINGS_FOR_HOOK: ApplicantSettings = mergeApplicantSettings({
  showPinSection: true,
});

type Fetcher = typeof fetch;

export type LoadApplicantSettingsResult =
  | { ok: true; settings: ApplicantSettings }
  | { ok: false; error: string };

export function getApplicantSettingsRetryDelay(retryCount: number) {
  return 1000 * Math.max(1, retryCount);
}

export function isApplicantSettingsAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function getApplicantSettingsErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function mergeApplicantSettingsResponse(data: unknown) {
  const applicants = data && typeof data === "object"
    ? (data as { applicants?: Partial<ApplicantSettings> }).applicants
    : undefined;

  return mergeApplicantSettings(applicants, DEFAULT_APPLICANT_SETTINGS_FOR_HOOK);
}

export async function fetchWithApplicantSettingsTimeout(
  input: Parameters<Fetcher>[0],
  init: RequestInit,
  fetcher: Fetcher = fetch,
  timeoutMs = APPLICANT_SETTINGS_REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loadApplicantSettingsFromApi(fetcher: Fetcher = fetch): Promise<LoadApplicantSettingsResult> {
  const response = await fetchWithApplicantSettingsTimeout('/api/user-preferences', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }, fetcher);

  if (!response.ok) {
    if (response.status === 401) {
      return {
        ok: false,
        error: 'Authentication required. Please refresh the page.',
      };
    }

    throw new Error(`Failed to load settings: ${response.status}`);
  }

  return {
    ok: true,
    settings: mergeApplicantSettingsResponse(await response.json()),
  };
}

export async function saveApplicantSettingsToApi(
  newSettings: ApplicantSettings,
  fetcher: Fetcher = fetch,
) {
  const response = await fetchWithApplicantSettingsTimeout('/api/user-preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelType: 'applicants',
      updates: newSettings,
    }),
  }, fetcher);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save settings: ${response.status} ${response.statusText} - ${errorText}`);
  }
}
