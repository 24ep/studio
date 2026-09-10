import { describe, expect, it } from 'vitest';

import {
  buildStatusPermissionDeniedExit,
  buildStatusUpdateAuditMessage,
} from './bulk-action-route-status-result';

describe('bulk status action result helpers', () => {
  it('builds permission denied early exits with audit details', () => {
    expect(buildStatusPermissionDeniedExit({
      actingUserName: 'Ada',
      deniedApplicants: [
        { applicantId: 'applicant-1', reason: 'NOT_OWNER' },
        { applicantId: 'applicant-2', reason: 'NO_PERMISSION' },
      ],
    })).toMatchObject({
      status: 403,
      body: {
        message: expect.stringContaining('applicant-1, applicant-2'),
        deniedApplicants: [
          { applicantId: 'applicant-1' },
          { applicantId: 'applicant-2' },
        ],
      },
      audit: {
        level: 'WARN',
        message: expect.stringContaining('by Ada'),
      },
    });
  });

  it('builds status update audit messages with rejection and auto-close details', () => {
    expect(buildStatusUpdateAuditMessage({
      newStatus: 'hired-stage',
      updatedCount: 3,
      rejectedCount: 2,
      autoCloseResults: [
        { autoCloseResult: { action: 'closed' } },
        { autoCloseResult: { action: 'unchanged' } },
      ],
    })).toBe('Updated status to hired-stage for 3 Applicants, rejected 2 Applicants due to headcount constraints, auto-closed 1 positions');
  });
});
