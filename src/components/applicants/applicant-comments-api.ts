import { readJsonOrFallback } from '../../lib/response-json';
import type {
  ApplicantCommentChannel,
  ApplicantReminderItem,
} from './applicant-comments-utils';
import {
  getApplicantCommentMutationErrorMessage,
  normalizeApplicantActivitiesPage,
  normalizeApplicantCommentsPage,
  normalizeReminderItems,
  type ApplicantActivitiesPage,
  type ApplicantCommentsPage,
} from './applicant-comments-api-normalizers';

export {
  getApplicantCommentMutationErrorMessage,
  type ApplicantActivitiesPage,
  type ApplicantCommentsPage,
};

export async function fetchApplicantCommentsPage({
  applicantId,
  limit,
  offset,
  signal,
}: {
  applicantId: string;
  limit: number;
  offset: number;
  signal?: AbortSignal;
}): Promise<ApplicantCommentsPage | null> {
  const response = await fetch(`/api/applicants/${applicantId}/comments?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
    signal,
  });

  if (!response.ok) return null;

  return normalizeApplicantCommentsPage(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchApplicantActivitiesPage({
  applicantId,
  limit,
  offset,
}: {
  applicantId: string;
  limit: number;
  offset: number;
}): Promise<ApplicantActivitiesPage | null> {
  const response = await fetch(`/api/applicants/${applicantId}/logs?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  });

  if (!response.ok) return null;

  return normalizeApplicantActivitiesPage(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchApplicantReminders(applicantId: string): Promise<ApplicantReminderItem[] | null> {
  const response = await fetch(`/api/applicants/${applicantId}/reminders`, {
    credentials: 'include',
  });

  if (!response.ok) return null;

  return normalizeReminderItems(await readJsonOrFallback<unknown>(response, {}));
}

export async function createApplicantReminder({
  applicantId,
  title,
  reminderDate,
}: {
  applicantId: string;
  title: string;
  reminderDate: string;
}) {
  const response = await fetch(`/api/applicants/${applicantId}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, reminderDate }),
  });

  if (!response.ok) throw new Error('Failed to create reminder');
}

export function buildApplicantCommentFormData({
  content,
  channel,
  files,
  labels,
}: {
  content: string;
  channel: ApplicantCommentChannel;
  files: File[];
  labels: string[];
}) {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('type', channel);
  files.forEach(file => formData.append('attachments', file));
  labels.forEach(label => formData.append('labels', label));
  return formData;
}

export async function addApplicantComment({
  applicantId,
  content,
  channel,
  files,
  labels,
}: {
  applicantId: string;
  content: string;
  channel: ApplicantCommentChannel;
  files: File[];
  labels: string[];
}): Promise<unknown> {
  const response = await fetch(`/api/applicants/${applicantId}/comments`, {
    method: 'POST',
    body: buildApplicantCommentFormData({ content, channel, files, labels }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText);
    throw new Error(getApplicantCommentMutationErrorMessage(response.status, errorText));
  }

  return readJsonOrFallback<unknown>(response, {});
}

export async function updateApplicantComment({
  applicantId,
  commentId,
  content,
}: {
  applicantId: string;
  commentId: string;
  content: string;
}) {
  const response = await fetch(`/api/applicants/${applicantId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) throw new Error('Failed to update comment');
}

export async function deleteApplicantComment({
  applicantId,
  commentId,
}: {
  applicantId: string;
  commentId: string;
}) {
  const response = await fetch(`/api/applicants/${applicantId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to delete comment');
}
