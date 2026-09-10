import type { Applicant } from '../../lib/types';
import { readJsonOrFallback } from '../../lib/response-json';
import {
  normalizeApplicantAttachments,
  type ApplicantAttachment,
} from './applicant-attachment-utils';
import type { ApplicantCommentItem } from './applicant-comments-utils';

export type { ApplicantAttachment };

export interface ApplicantDetailPreviewData {
  comments: ApplicantCommentItem[];
  attachments: ApplicantAttachment[];
  initialApplicant: Applicant | null;
  applicantExists: boolean | null;
  error: string | null;
}

export function isApplicantDetailAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toApplicantPreview(value: unknown): Applicant | null {
  return isRecord(value) ? value as unknown as Applicant : null;
}

export function normalizeApplicantDetailComments(value: unknown): ApplicantCommentItem[] {
  const list = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.data)
      ? value.data
      : [];

  return list.filter(isRecord) as ApplicantCommentItem[];
}

async function readFulfilledJson(result: PromiseSettledResult<Response>) {
  if (result.status !== 'fulfilled' || !result.value.ok) {
    return null;
  }

  return readJsonOrFallback<unknown>(result.value, null);
}

export async function loadApplicantDetailPreviewData(
  applicantId: string,
  signal?: AbortSignal
): Promise<ApplicantDetailPreviewData> {
  const [commentsRes, attachmentsRes, applicantRes] = await Promise.allSettled([
    fetch(`/api/applicants/${applicantId}/comments?limit=5&offset=0`, {
      credentials: 'include',
      signal,
    }),
    fetch(`/api/applicants/${applicantId}/resumes?limit=20&offset=0`, {
      credentials: 'include',
      signal,
    }),
    fetch(`/api/applicants/${applicantId}?lite=1`, {
      credentials: 'include',
      signal,
    }),
  ]);

  if (commentsRes.status === 'rejected' && isApplicantDetailAbortError(commentsRes.reason)) {
    throw commentsRes.reason;
  }
  if (attachmentsRes.status === 'rejected' && isApplicantDetailAbortError(attachmentsRes.reason)) {
    throw attachmentsRes.reason;
  }
  if (applicantRes.status === 'rejected' && isApplicantDetailAbortError(applicantRes.reason)) {
    throw applicantRes.reason;
  }

  const applicantNotFound = applicantRes.status === 'fulfilled' && applicantRes.value.status === 404;
  const applicantJson = applicantNotFound ? null : await readFulfilledJson(applicantRes);

  return {
    comments: normalizeApplicantDetailComments(await readFulfilledJson(commentsRes)),
    attachments: normalizeApplicantAttachments(await readFulfilledJson(attachmentsRes)),
    initialApplicant: toApplicantPreview(applicantJson),
    applicantExists: applicantNotFound ? false : true,
    error: applicantNotFound ? 'Applicant not found' : null,
  };
}
