import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  DEFAULT_INTERVIEW_INVITATION_TEMPLATE,
  buildEvaluationLinkPayload,
  buildEvaluationQrDownloadFilename,
  buildInvitationEmailPayload,
  createInterviewDateTime,
  copyCreateEvaluateLinkToClipboard,
  downloadCreateEvaluateLinkQrCode,
  filterAzureMeetingRooms,
  filterUsersBySearchQuery,
  getApplicantPositionId,
  getAvailableUsersForInterviewers,
  getCreateEvaluateLinkEditState,
  getCreateEvaluateLinkErrorMessage,
  getCreateEvaluateLinkNextAction,
  getCreateEvaluateLinkSteps,
  getDefaultCreateEvaluateLinkModalState,
  getStepIndex,
  hasEvaluationSkills,
  hasMatchingAzureMeetingRoom,
  normalizeInterviewInvitationTemplateSettings,
  parseInitialInterviewDateTime,
  shouldSendCreateEvaluateLinkInvitation,
  toggleStringSet,
} from './create-evaluate-link-utils';

describe('create evaluate link utilities', () => {
  it('resolves applicant position ids and evaluation-skill availability', () => {
    expect(getApplicantPositionId({ positionId: 'direct', position: { id: 'nested', title: 'Role' } })).toBe('direct');
    expect(getApplicantPositionId({ positionId: null, position: { id: 'nested', title: 'Role' } })).toBe('nested');
    expect(hasEvaluationSkills({ expertiseSkills: [{}] })).toBe(true);
    expect(hasEvaluationSkills({ personalityTraits: [], expertiseGroups: [] })).toBe(false);
  });

  it('normalizes email template settings from array or object responses', () => {
    expect(normalizeInterviewInvitationTemplateSettings({
      settings: [
        { key: 'emailTemplateInterviewInvitationSubject', value: 'Subject' },
        { key: 'emailTemplateInterviewInvitation', value: '<p>Body</p>' },
        { key: 'appLogoDataUrl', value: 'data:image/png;base64,logo' },
        { key: 'emailTemplateInterviewInvitationEditorMode', value: 'html' },
      ],
    })).toEqual({
      subject: 'Subject',
      body: '<p>Body</p>',
      appLogoUrl: 'data:image/png;base64,logo',
      editorMode: 'html',
    });

    expect(normalizeInterviewInvitationTemplateSettings({}).subject).toBe(DEFAULT_INTERVIEW_INVITATION_SUBJECT);
    expect(normalizeInterviewInvitationTemplateSettings({}).body).toBe(DEFAULT_INTERVIEW_INVITATION_TEMPLATE);
    expect(normalizeInterviewInvitationTemplateSettings({
      emailTemplateInterviewInvitationSubject: 123,
      emailTemplateInterviewInvitation: null,
      qrCodeLogo: { url: '/logo.png' },
    })).toEqual({
      subject: DEFAULT_INTERVIEW_INVITATION_SUBJECT,
      body: DEFAULT_INTERVIEW_INVITATION_TEMPLATE,
      appLogoUrl: null,
      editorMode: 'wysiwyg',
    });
  });

  it('creates interview dates without mutating the source date', () => {
    const original = new Date('2026-06-01T00:00:00.000Z');
    const scheduled = createInterviewDateTime(original, '13:45');

    expect(original.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(scheduled?.getHours()).toBe(13);
    expect(scheduled?.getMinutes()).toBe(45);
  });

  it('builds evaluation link and invitation payloads', () => {
    const interviewDate = new Date('2026-06-01T00:00:00.000Z');
    const linkPayload = buildEvaluationLinkPayload({
      expireDays: 900,
      requireLogin: true,
      interviewDate,
      interviewTime: '09:30',
      location: 'Room A',
    });

    expect(linkPayload.days).toBe(365);
    expect(linkPayload.interviewDateTime).toBe(createInterviewDateTime(interviewDate, '09:30')?.toISOString());
    expect(linkPayload.interviewLocation).toBe('Room A');

    expect(buildInvitationEmailPayload({
      selectedInterviewerIds: new Set(['u1', 'u2']),
      interviewTime: '10:00',
      duration: 60,
      location: '',
      emailSubject: 'Subject',
      emailBody: 'Body',
      evaluationLink: 'https://example.test/evaluate',
      now: new Date('2026-06-02T03:00:00.000Z'),
    })).toEqual({
      interviewerIds: ['u1', 'u2'],
      interviewDate: '2026-06-02T03:00:00.000Z',
      interviewTime: '10:00',
      duration: 60,
      location: undefined,
      locationEmail: undefined,
      emailSubject: 'Subject',
      emailBody: 'Body',
      evaluationLink: 'https://example.test/evaluate',
    });
  });

  it('filters rooms and users for picker lists', () => {
    const users = [
      { id: '1', name: 'Alice Chen', email: 'alice@example.test', role: 'user' },
      { id: '2', name: 'Bob Stone', email: 'bob@example.test', role: 'user' },
    ];
    const interviewers = [{ id: 'inv-1', userId: '1', userName: 'Alice Chen', userEmail: 'alice@example.test' }];

    expect(getAvailableUsersForInterviewers(users, interviewers).map(user => user.id)).toEqual(['2']);
    expect(filterUsersBySearchQuery(users, 'stone').map(user => user.id)).toEqual(['2']);

    const rooms = [
      { id: 'a', displayName: 'Orchid', capacity: 8, building: 'HQ' },
      { id: 'b', displayName: 'Lotus', capacity: 12, building: 'Branch' },
    ];

    expect(filterAzureMeetingRooms(rooms, 'hq').map(room => room.id)).toEqual(['a']);
    expect(hasMatchingAzureMeetingRoom(rooms, 'missing')).toBe(false);
  });

  it('derives steps, selections, edit dates, and filenames', () => {
    expect(getCreateEvaluateLinkSteps(true, true).map(step => step.id)).toEqual(['configure', 'email', 'success']);
    expect(getCreateEvaluateLinkSteps(true, false).map(step => step.id)).toEqual(['configure', 'success']);
    expect(getStepIndex(getCreateEvaluateLinkSteps(true, true), 'email')).toBe(1);
    expect(Array.from(toggleStringSet(new Set(['a']), 'a'))).toEqual([]);
    expect(Array.from(toggleStringSet(new Set(['a']), 'b', true))).toEqual(['a', 'b']);
    expect(parseInitialInterviewDateTime('2026-06-01T09:15:00')?.time).toBe('09:15');
    expect(buildEvaluationQrDownloadFilename('Ada Lovelace')).toBe('evaluation-qr-Ada_Lovelace.png');
    expect(buildEvaluationQrDownloadFilename('   ')).toBe('evaluation-qr-applicant.png');
  });

  it('derives modal edit and reset state', () => {
    const editState = getCreateEvaluateLinkEditState({
      interviewDateTime: '2026-06-01T09:15:00',
      interviewLocation: 'Room A',
      interviewers: [{ id: 'user-1', name: 'Ada' }],
    });

    expect(editState.interviewDate?.getFullYear()).toBe(2026);
    expect(editState.interviewTime).toBe('09:15');
    expect(editState.location).toBe('Room A');
    expect(Array.from(editState.selectedInterviewerIds || [])).toEqual(['user-1']);

    const resetState = getDefaultCreateEvaluateLinkModalState();
    expect(resetState).toMatchObject({
      currentStep: 'configure',
      interviewTime: '09:00',
      duration: 60,
      location: '',
      expireDays: 7,
      requireLogin: true,
      sendEmail: true,
      copied: false,
      isCustomLocation: false,
    });
    expect(resetState.selectedInterviewerIds.size).toBe(0);
    expect(resetState.selectedUserIds.size).toBe(0);
  });

  it('derives next-step and email-send decisions', () => {
    expect(getCreateEvaluateLinkNextAction({
      currentStep: 'configure',
      invitationEnabled: true,
      sendEmail: true,
    })).toEqual({
      nextStep: 'email',
      shouldCreateLink: false,
      skipEmail: true,
    });

    expect(getCreateEvaluateLinkNextAction({
      currentStep: 'configure',
      invitationEnabled: false,
      sendEmail: true,
    })).toEqual({
      shouldCreateLink: true,
      skipEmail: true,
    });

    expect(getCreateEvaluateLinkNextAction({
      currentStep: 'email',
      invitationEnabled: true,
      sendEmail: true,
    })).toEqual({
      shouldCreateLink: true,
      skipEmail: false,
    });

    expect(shouldSendCreateEvaluateLinkInvitation({
      skipEmail: false,
      sendEmail: true,
      invitationEnabled: true,
      selectedInterviewerCount: 1,
    })).toBe(true);
    expect(shouldSendCreateEvaluateLinkInvitation({
      skipEmail: true,
      sendEmail: true,
      invitationEnabled: true,
      selectedInterviewerCount: 1,
    })).toBe(false);
    expect(shouldSendCreateEvaluateLinkInvitation({
      skipEmail: false,
      sendEmail: true,
      invitationEnabled: true,
      selectedInterviewerCount: 0,
    })).toBe(false);
  });

  it('delegates modal browser actions safely', async () => {
    const copiedValues: string[] = [];
    const clipboard = {
      writeText: async (value: string) => {
        copiedValues.push(value);
      },
    };

    await copyCreateEvaluateLinkToClipboard('https://example.test/evaluate', clipboard);
    expect(copiedValues).toEqual(['https://example.test/evaluate']);
    expect(getCreateEvaluateLinkErrorMessage(new Error('Cannot create'))).toBe('Cannot create');
    expect(getCreateEvaluateLinkErrorMessage('bad')).toBe('Failed to create evaluation link');

    const clickedDownloads: string[] = [];
    const appendedDownloads: string[] = [];
    const removedDownloads: string[] = [];
    const fakeDownloadLink = {
      href: '',
      download: '',
      click: () => clickedDownloads.push(fakeDownloadLink.download),
    };
    const fakeDocument = {
      getElementById: (id: string) => id === 'evaluate-qr-code'
        ? ({
            toDataURL: () => 'data:image/png;base64,qr',
          } as unknown as HTMLCanvasElement)
        : null,
      createElement: () => fakeDownloadLink,
      body: {
        appendChild: (link: typeof fakeDownloadLink) => {
          appendedDownloads.push(link.download);
          return link;
        },
        removeChild: (link: typeof fakeDownloadLink) => {
          removedDownloads.push(link.download);
          return link;
        },
      },
    } as unknown as Document;

    expect(downloadCreateEvaluateLinkQrCode({
      applicantName: 'Ada Lovelace',
      documentRef: fakeDocument,
    })).toBe(true);
    expect(fakeDownloadLink.href).toBe('data:image/png;base64,qr');
    expect(clickedDownloads).toEqual(['evaluation-qr-Ada_Lovelace.png']);
    expect(appendedDownloads).toEqual(['evaluation-qr-Ada_Lovelace.png']);
    expect(removedDownloads).toEqual(['evaluation-qr-Ada_Lovelace.png']);
    expect(downloadCreateEvaluateLinkQrCode({
      applicantName: 'Ada Lovelace',
      canvasId: 'missing',
      documentRef: fakeDocument,
    })).toBe(false);
  });
});
