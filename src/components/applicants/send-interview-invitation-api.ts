import type { Applicant } from '@/lib/types';
import { readJsonOrFallback } from '../../lib/response-json';
import {
  buildInterviewInvitationPayload,
  DEFAULT_INTERVIEW_INVITATION_BODY,
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  getResponseMessage,
  normalizeInterviewers,
  normalizeInterviewInvitationResult,
  normalizeMeetingRooms,
  normalizeUsers,
  parseInterviewEmailTemplateSettings,
} from './send-interview-invitation-api-utils';

export {
  buildInterviewInvitationDateTime,
  DEFAULT_INTERVIEW_INVITATION_BODY,
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  parseInterviewEmailTemplateSettings,
} from './send-interview-invitation-api-utils';

export interface Interviewer {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  positionTitle?: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  positionTitle?: string;
}

export interface MeetingRoom {
  id: string;
  displayName: string;
  emailAddress: string;
}

export interface InterviewEmailTemplate {
  subject: string;
  body: string;
}

export interface AddInterviewersResult {
  successCount: number;
  errorCount: number;
  userIds: string[];
}

export interface InterviewInvitationResult {
  results?: unknown[];
  errors?: unknown[];
  message?: string;
}

export async function fetchMeetingRooms(): Promise<MeetingRoom[]> {
  const response = await fetch('/api/rooms');
  if (!response.ok) return [];
  return normalizeMeetingRooms(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchPositionInterviewers(positionId: string): Promise<Interviewer[]> {
  const response = await fetch(`/api/positions/${positionId}/interviewers`);
  if (!response.ok) {
    throw new Error('Failed to load interviewers');
  }
  return normalizeInterviewers(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchAvailableUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to load users');
  }
  return normalizeUsers(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchInterviewEmailTemplate(): Promise<InterviewEmailTemplate> {
  const response = await fetch('/api/settings/system-settings?keys=emailTemplateInterviewInvitationSubject,emailTemplateInterviewInvitation');
  if (!response.ok) {
    throw new Error('Failed to load email template');
  }
  return parseInterviewEmailTemplateSettings(await readJsonOrFallback<unknown>(response, {}));
}

export async function addPositionInterviewers(positionId: string, userIds: string[]): Promise<AddInterviewersResult> {
  let successCount = 0;
  let errorCount = 0;

  await Promise.all(userIds.map(async (userId) => {
    try {
      const response = await fetch(`/api/positions/${positionId}/interviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(getResponseMessage(
          await readJsonOrFallback<unknown>(response, {}),
          'Failed to add interviewer',
        ));
      }

      successCount++;
    } catch {
      errorCount++;
    }
  }));

  return { successCount, errorCount, userIds };
}

export async function sendInterviewInvitation({
  applicant,
  selectedInterviewerIds,
  interviewDate,
  interviewTime,
  duration,
  location,
  locationEmail,
  notes,
  emailSubject,
  emailBody,
}: {
  applicant: Applicant;
  selectedInterviewerIds: Set<string>;
  interviewDate: Date;
  interviewTime: string;
  duration: number;
  location: string;
  locationEmail: string;
  notes: string;
  emailSubject: string;
  emailBody: string;
}) {
  const response = await fetch(
    `/api/applicants/${applicant.id}/send-interview-invitation`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInterviewInvitationPayload({
        applicant,
        selectedInterviewerIds,
        interviewDate,
        interviewTime,
        duration,
        location,
        locationEmail,
        notes,
        emailSubject,
        emailBody,
      })),
    }
  );

  const data = normalizeInterviewInvitationResult(await readJsonOrFallback<unknown>(response, {}));

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send invitations');
  }

  return data;
}
