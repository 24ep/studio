import type { Applicant } from '@/lib/types';
import { getSystemSettingString } from '../../lib/system-settings-response';
import type {
  InterviewEmailTemplate,
  InterviewInvitationResult,
  Interviewer,
  MeetingRoom,
  User,
} from './send-interview-invitation-api';

export const DEFAULT_INTERVIEW_INVITATION_SUBJECT = 'Interview Invitation: {{ApplicantName}} - {{positionTitle}}';

export const DEFAULT_INTERVIEW_INVITATION_BODY = '<p>Dear {{interviewerName}},</p><p>You have been invited to interview {{ApplicantName}} for the position of {{positionTitle}}.</p><p><strong>Date:</strong> {{interviewDate}}</p><p><strong>Time:</strong> {{interviewTime}}</p><p><strong>Location:</strong> {{interviewLocation}}</p><p style="text-align: center;"><a href="{{evaluationLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Evaluate Applicant</a></p>';

interface BuildInterviewInvitationPayloadParams {
  applicant: Applicant;
  duration: number;
  emailBody: string;
  emailSubject: string;
  interviewDate: Date;
  interviewTime: string;
  location: string;
  locationEmail: string;
  notes: string;
  selectedInterviewerIds: Set<string>;
}

type RecordNormalizer<T> = (record: Record<string, unknown>) => T;

export function normalizeMeetingRooms(value: unknown): MeetingRoom[] {
  return normalizeRecordList(value, normalizeMeetingRoom)
    .filter((room) => Boolean(room.id && room.displayName && room.emailAddress));
}

export function normalizeInterviewers(value: unknown): Interviewer[] {
  return normalizeRecordList(value, normalizeInterviewer)
    .filter((interviewer) => Boolean(interviewer.id && interviewer.userId));
}

export function normalizeUsers(value: unknown): User[] {
  return normalizeRecordList(value, normalizeUser, 'users')
    .filter((user) => Boolean(user.id));
}

export function normalizeInterviewInvitationResult(value: unknown): InterviewInvitationResult {
  const record = isRecord(value) ? value : {};
  const result: InterviewInvitationResult = {
    ...getArrayProperty(record, 'results'),
    ...getArrayProperty(record, 'errors'),
  };

  const message = getString(record.message);
  if (message) {
    result.message = message;
  }

  return result;
}

export function getResponseMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === 'string' ? value.message : fallback;
}

export function parseInterviewEmailTemplateSettings(data: unknown): InterviewEmailTemplate {
  return {
    subject: getSystemSettingString(data, 'emailTemplateInterviewInvitationSubject') || DEFAULT_INTERVIEW_INVITATION_SUBJECT,
    body: getSystemSettingString(data, 'emailTemplateInterviewInvitation') || DEFAULT_INTERVIEW_INVITATION_BODY,
  };
}

export function buildInterviewInvitationDateTime(interviewDate: Date, interviewTime: string) {
  const dateTime = new Date(interviewDate);
  const { hours, minutes } = parseInterviewTime(interviewTime);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
}

export function buildInterviewInvitationPayload({
  duration,
  emailBody,
  emailSubject,
  interviewDate,
  interviewTime,
  location,
  locationEmail,
  notes,
  selectedInterviewerIds,
}: BuildInterviewInvitationPayloadParams) {
  const dateTime = buildInterviewInvitationDateTime(interviewDate, interviewTime);

  return {
    interviewerIds: Array.from(selectedInterviewerIds),
    interviewDate: dateTime.toISOString(),
    interviewTime,
    duration,
    location: location || undefined,
    locationEmail: locationEmail || undefined,
    notes: notes || undefined,
    emailSubject,
    emailBody,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRecordList<T>(value: unknown, normalizeRecord: RecordNormalizer<T>, key?: string) {
  return normalizeListPayload(value, key)
    .filter(isRecord)
    .map(normalizeRecord);
}

function normalizeMeetingRoom(room: Record<string, unknown>): MeetingRoom {
  return {
    id: getString(room.id),
    displayName: getString(room.displayName),
    emailAddress: getString(room.emailAddress),
  };
}

function normalizeInterviewer(interviewer: Record<string, unknown>): Interviewer {
  return {
    id: getString(interviewer.id),
    userId: getString(interviewer.userId),
    userName: getString(interviewer.userName),
    userEmail: getString(interviewer.userEmail),
    positionTitle: getOptionalString(interviewer.positionTitle),
  };
}

function normalizeUser(user: Record<string, unknown>): User {
  return {
    id: getString(user.id),
    name: getString(user.name),
    email: getString(user.email),
    role: getString(user.role),
    positionTitle: getOptionalString(user.positionTitle),
  };
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getOptionalString(value: unknown) {
  return getString(value) || undefined;
}

function getArrayProperty(record: Record<string, unknown>, key: 'results' | 'errors') {
  return Array.isArray(record[key]) ? { [key]: record[key] } : {};
}

function parseInterviewTime(interviewTime: string) {
  const [hours = 0, minutes = 0] = interviewTime.split(':').map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function normalizeListPayload(value: unknown, key?: string): unknown[] {
  if (Array.isArray(value)) return value;
  if (key && isRecord(value) && Array.isArray(value[key])) return value[key];
  if (isRecord(value) && Array.isArray(value.data)) return value.data;
  return [];
}
