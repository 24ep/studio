import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Applicant } from '@/lib/types';

import {
  DEFAULT_INTERVIEW_INVITATION_BODY,
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  addPositionInterviewers,
  buildInterviewInvitationDateTime,
  fetchAvailableUsers,
  parseInterviewEmailTemplateSettings,
  sendInterviewInvitation,
} from './send-interview-invitation-api';
import {
  normalizeInterviewInvitationResult,
  normalizeInterviewers,
  normalizeMeetingRooms,
} from './send-interview-invitation-api-utils';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: init?.status ?? 200,
    statusText: init?.statusText,
  });
}

describe('send-interview-invitation-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses email template settings from array and object shapes', () => {
    expect(parseInterviewEmailTemplateSettings({
      settings: [
        { key: 'emailTemplateInterviewInvitationSubject', value: 'Subject {{ApplicantName}}' },
        { key: 'emailTemplateInterviewInvitation', value: '<p>Body</p>' },
      ],
    })).toEqual({
      subject: 'Subject {{ApplicantName}}',
      body: '<p>Body</p>',
    });

    expect(parseInterviewEmailTemplateSettings({})).toEqual({
      subject: DEFAULT_INTERVIEW_INVITATION_SUBJECT,
      body: DEFAULT_INTERVIEW_INVITATION_BODY,
    });
  });

  it('loads users from the API response users property', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      users: [{ id: 'user-1', name: 'Ada', email: 'ada@example.com', role: 'Interviewer' }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAvailableUsers()).resolves.toEqual([
      { id: 'user-1', name: 'Ada', email: 'ada@example.com', role: 'Interviewer' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/users');
  });

  it('normalizes meeting rooms, interviewers, and invitation results safely', () => {
    expect(normalizeMeetingRooms({
      data: [
        { id: 'room-1', displayName: 'Room 1', emailAddress: 'room@example.com' },
        { id: 'missing-email', displayName: 'Broken' },
        null,
      ],
    })).toEqual([
      { id: 'room-1', displayName: 'Room 1', emailAddress: 'room@example.com' },
    ]);

    expect(normalizeInterviewers([
      { id: 'assignment-1', userId: 'user-1', userName: 'Ada', userEmail: 'ada@example.com', positionTitle: '' },
      { id: '', userId: 'user-2' },
    ])).toEqual([
      { id: 'assignment-1', userId: 'user-1', userName: 'Ada', userEmail: 'ada@example.com', positionTitle: undefined },
    ]);

    expect(normalizeInterviewInvitationResult({
      results: [{ id: 'sent-1' }],
      errors: [{ id: 'failed-1' }],
      message: 'Done',
    })).toEqual({
      results: [{ id: 'sent-1' }],
      errors: [{ id: 'failed-1' }],
      message: 'Done',
    });
    expect(normalizeInterviewInvitationResult('bad')).toEqual({});
  });

  it('adds interviewers and reports partial failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ message: 'Already assigned' }, { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(addPositionInterviewers('position-1', ['user-1', 'user-2'])).resolves.toEqual({
      successCount: 1,
      errorCount: 1,
      userIds: ['user-1', 'user-2'],
    });
    expect(fetchMock.mock.calls.map(call => [call[0], JSON.parse(String(call[1]?.body))])).toEqual([
      ['/api/positions/position-1/interviewers', { userId: 'user-1' }],
      ['/api/positions/position-1/interviewers', { userId: 'user-2' }],
    ]);
  });

  it('builds interview date time from date and HH:mm value', () => {
    const dateTime = buildInterviewInvitationDateTime(new Date(2026, 0, 10), '13:45');

    expect(dateTime.getFullYear()).toBe(2026);
    expect(dateTime.getMonth()).toBe(0);
    expect(dateTime.getDate()).toBe(10);
    expect(dateTime.getHours()).toBe(13);
    expect(dateTime.getMinutes()).toBe(45);

    const fallbackDateTime = buildInterviewInvitationDateTime(new Date(2026, 0, 10), 'bad');
    expect(fallbackDateTime.getHours()).toBe(0);
    expect(fallbackDateTime.getMinutes()).toBe(0);
  });

  it('sends interview invitation payload with optional fields omitted when empty', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [{ id: 'sent-1' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendInterviewInvitation({
      applicant: { id: 'applicant-1' } as Applicant,
      selectedInterviewerIds: new Set(['user-1', 'user-2']),
      interviewDate: new Date(2026, 0, 10),
      interviewTime: '09:30',
      duration: 45,
      location: '',
      locationEmail: '',
      notes: '',
      emailSubject: 'Subject',
      emailBody: '<p>Body</p>',
    })).resolves.toEqual({ results: [{ id: 'sent-1' }] });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/applicants/applicant-1/send-interview-invitation',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const [, requestInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      interviewerIds: ['user-1', 'user-2'],
      interviewTime: '09:30',
      duration: 45,
      emailSubject: 'Subject',
      emailBody: '<p>Body</p>',
    });
  });
});
