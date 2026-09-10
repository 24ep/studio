import { describe, expect, it } from 'vitest';
import {
  getApplicantActivityLogsPage,
  getApplicationActivityLog,
  getTransitionActivityNote,
  compareApplicantActivityLogsByNewest,
  getApplicantImportActivityLogs,
  type ApplicantActivityLog,
} from './applicant-logs-format-utils';

describe('applicant-logs-format-utils', () => {
  it('builds an applied activity with the application attachments', () => {
    const transitions = [{
      id: 'transition-1',
      stage: 'Applied',
      date: new Date('2026-01-02T00:00:00Z'),
      actingUser: { name: 'Recruiter' },
    }] as unknown as Parameters<typeof getApplicationActivityLog>[0]['transitions'];
    const attachments = [{
      id: 'attachment-1',
      applicantId: 'applicant-1',
      fileName: 'resume.pdf',
      filePath: 'attachments/resume.pdf',
      label: 'resume',
      url: '/api/secure-file/preview?filePath=attachments%2Fresume.pdf',
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      uploadedBy: { name: 'Recruiter' },
    }] as unknown as Parameters<typeof getApplicationActivityLog>[0]['attachments'];

    expect(getApplicationActivityLog({
      applicant: {
        id: 'applicant-1',
        applicationDate: new Date('2026-01-01T00:00:00Z'),
        position: { title: 'Product Designer' },
      },
      attachments,
      transitions,
      stageIdToName: new Map(),
    })).toMatchObject({
      id: 'application-applicant-1',
      action: 'Applied',
      user: 'Recruiter',
      note: 'Applied for Product Designer.',
      attachments: [{
        id: 'attachment-1',
        fileName: 'resume.pdf',
        label: 'resume',
      }],
    });
  });

  it('formats stage transition notes with stage names and optional notes', () => {
    const stageIdToName = new Map([
      ['stage-1', 'Screening'],
      ['stage-2', 'Interview'],
    ]);

    expect(getTransitionActivityNote({
      currentStage: 'stage-2',
      notes: ' Strong profile ',
      previousStage: 'stage-1',
      stageIdToName,
    })).toBe('Moved from Screening to Interview stage. Note: Strong profile');

    expect(getTransitionActivityNote({
      currentStage: 'stage-2',
      notes: '',
      previousStage: null,
      stageIdToName,
    })).toBe('Entered Interview stage.');
  });

  it('sorts valid activity dates newest first and leaves invalid comparisons equal', () => {
    const older = { time: new Date('2024-01-01') } as ApplicantActivityLog;
    const newer = { time: new Date('2024-01-02') } as ApplicantActivityLog;
    const invalid = { time: new Date('bad-date') } as ApplicantActivityLog;

    expect(compareApplicantActivityLogsByNewest(older, newer)).toBeGreaterThan(0);
    expect(compareApplicantActivityLogsByNewest(newer, older)).toBeLessThan(0);
    expect(compareApplicantActivityLogsByNewest(invalid, older)).toBe(0);
  });

  it('paginates activity logs with total and hasMore metadata', () => {
    const logs = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ] as ApplicantActivityLog[];

    expect(getApplicantActivityLogsPage(logs, { limit: 2, offset: 1 })).toEqual({
      data: [{ id: '2' }, { id: '3' }],
      pagination: {
        limit: 2,
        offset: 1,
        hasMore: false,
        total: 3,
      },
    });
  });

  it('shows imported applicant attribute changes in the activity timeline', () => {
    const logs = getApplicantImportActivityLogs([{
      id: 'log-1',
      timestamp: new Date('2026-08-01T00:00:00Z'),
      details: {
        action: 'IMPORTED_UPDATE',
        changedAttributes: {
          email: { from: 'old@example.com', to: 'new@example.com' },
          positionId: { from: null, to: 'position-1' },
        },
      },
      actingUser: { name: 'Queue Admin' },
    }] as unknown as Parameters<typeof getApplicantImportActivityLogs>[0]);

    expect(logs[0]).toMatchObject({
      action: 'Updated by import',
      user: 'Queue Admin',
      note: 'email: old@example.com → new@example.com; positionId: blank → position-1',
    });
  });
});
