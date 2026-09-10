import { describe, expect, it } from 'vitest';
import {
  buildHeadcountValidationErrorRejection,
  bulkActionSchema,
  canPerformBulkApplicantAction,
  getBulkApplicantActionForbiddenMessage,
  partitionApplicantsByPermission,
  resolveReprocessPositionId,
  selectReprocessAttachment,
  validateApplicantHiringStatusWithClient,
  type QueryableClient,
} from './bulk-action-route-utils';

describe('bulk-action-route-utils', () => {
  it('requires a new status for status changes', () => {
    const result = bulkActionSchema.safeParse({
      action: 'change_status',
      applicantIds: ['3ef92d46-ec74-4f35-95a2-b8b63e0c7df8'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.newStatus).toEqual([
        "newStatus is required when action is 'change_status'",
      ]);
    }
  });

  it('allows admins to perform supported bulk applicant actions', () => {
    const hasAnyPermission = (user: { role?: string } | null | undefined) => user?.role === 'Admin';

    expect(canPerformBulkApplicantAction({ role: 'Admin' }, 'delete', hasAnyPermission)).toBe(true);
    expect(canPerformBulkApplicantAction({ role: 'Admin' }, 'reprocess', hasAnyPermission)).toBe(true);
    expect(canPerformBulkApplicantAction({ role: 'Admin' }, 'unknown', hasAnyPermission)).toBe(false);
  });

  it('returns action-specific forbidden messages', () => {
    expect(getBulkApplicantActionForbiddenMessage('assign_recruiter')).toContain('assign recruiters');
    expect(getBulkApplicantActionForbiddenMessage('change_status')).toContain('update Applicant status');
    expect(getBulkApplicantActionForbiddenMessage('unknown')).toContain('perform this action');
  });

  it('partitions applicants by per-applicant permission decisions', () => {
    const result = partitionApplicantsByPermission([
      { id: 'applicant-1', recruiterId: 'user-1' },
      { id: 'applicant-2', recruiterId: 'user-2' },
    ], (applicant) => ({
      allowed: applicant.recruiterId === 'user-1',
      reason: applicant.recruiterId === 'user-1' ? undefined : 'Not owner',
    }));

    expect(result.applicantsWithPermission).toEqual([
      { id: 'applicant-1', recruiterId: 'user-1' },
    ]);
    expect(result.applicantsWithoutPermission).toEqual([
      { applicantId: 'applicant-2', reason: 'Not owner' },
    ]);
  });

  it('maps headcount validation errors to stable rejection payloads', () => {
    expect(buildHeadcountValidationErrorRejection(
      { id: 'applicant-1' },
      new Error('connection timeout')
    )).toMatchObject({
      applicantId: 'applicant-1',
      reason: 'CONNECTION_ERROR',
      message: 'Database connection error during headcount validation',
      headcountStatus: null,
      originalError: 'connection timeout',
    });

    expect(buildHeadcountValidationErrorRejection(
      { id: 'applicant-2' },
      new Error('foreign key constraint failed')
    )).toMatchObject({
      applicantId: 'applicant-2',
      reason: 'DATA_INTEGRITY_ERROR',
      message: 'Data integrity error during headcount validation',
    });

    expect(buildHeadcountValidationErrorRejection({ id: 'applicant-3' }, 'unknown failure')).toMatchObject({
      applicantId: 'applicant-3',
      reason: 'VALIDATION_ERROR',
      message: 'Error validating headcount availability',
      originalError: 'unknown failure',
    });
  });

  it('selects a resume attachment before falling back to the first attachment', () => {
    const genericAttachment = { id: 'attachment-1', label: 'portfolio' };
    const resumeAttachment = { id: 'attachment-2', label: 'Resume' };

    expect(selectReprocessAttachment([genericAttachment, resumeAttachment])).toBe(resumeAttachment);
    expect(selectReprocessAttachment([genericAttachment])).toBe(genericAttachment);
    expect(selectReprocessAttachment([])).toBeNull();
  });

  it('resolves reprocess position from parsed data before applicant position', () => {
    expect(resolveReprocessPositionId({
      positionId: 'position-from-applicant',
      parsedData: { job_applied: { jobId: 'position-from-parsed-data' } },
    })).toBe('position-from-parsed-data');
    expect(resolveReprocessPositionId({ positionId: 'position-from-applicant' })).toBe('position-from-applicant');
    expect(resolveReprocessPositionId({ parsedData: null })).toBeNull();
  });

  it('validates headcount availability with an existing vacant headcount', async () => {
    const client: QueryableClient = {
      query: async <Row,>() => ({
        rows: [
          { id: 'headcount-1', status: 'filled', applicantId: 'other-applicant' },
          { id: 'headcount-2', status: 'vacant', applicantId: null },
        ] as Row[],
      }),
    };

    const result = await validateApplicantHiringStatusWithClient(client, 'applicant-1', 'position-1');

    expect(result.canHire).toBe(true);
    expect(result.reason).toBe('VACANT_HEADCOUNT_AVAILABLE');
    expect(result.availableHeadcountId).toBe('headcount-2');
    expect(result.headcountStatus.vacantHeadcounts).toBe(1);
  });
});
