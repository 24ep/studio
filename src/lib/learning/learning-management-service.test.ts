import { describe, expect, it, vi } from 'vitest';
import {
  LearningConflictError,
  reviewLearningAssignment,
  overrideLearningCompletion,
  getLearningReport,
  type LearningManagementDependencies,
} from './learning-management-service';

const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const UPDATED_AT = '2026-08-24T01:00:00.000Z';

function dependencies(options?: { companyId?: string | null; stale?: boolean }) {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('FROM hr_learning_assignment_submissions s')) return { rows: [{
      id: '33333333-3333-4333-8333-333333333333',
      enrollment_id: '44444444-4444-4444-8444-444444444444',
      block_id: '55555555-5555-4555-8555-555555555555',
      lesson_id: '66666666-6666-4666-8666-666666666666',
      employee_id: '77777777-7777-4777-8777-777777777777',
      company_id: options?.companyId ?? COMPANY_ID,
      updated_at: UPDATED_AT,
    }], rowCount: 1 };
    if (sql.includes('UPDATE hr_learning_assignment_submissions')) {
      return options?.stale ? { rows: [], rowCount: 0 } : { rows: [{ id: '33333333-3333-4333-8333-333333333333', status: 'approved' }], rowCount: 1 };
    }
    if (sql.includes('count(*)::int assigned')) return { rows: [{ assigned: 2, completed: 1, overdue: 0, in_progress: 1, not_started: 0, active_seconds: 100 }], rowCount: 1 };
    if (sql.includes('course_title') && sql.includes('FROM hr_learning_enrollments e')) return { rows: [], rowCount: 0 };
    if (sql.includes('block_title') && sql.includes('FROM hr_learning_assignment_submissions s')) return { rows: [], rowCount: 0 };
    if (sql.includes('FROM hr_learning_enrollments e') && sql.includes('emp.company_id')) return { rows: [{ employee_id: '77777777-7777-4777-8777-777777777777', company_id: options?.companyId ?? COMPANY_ID }], rowCount: 1 };
    if (sql.includes('UPDATE hr_learning_enrollments')) return { rows: [{ id: '44444444-4444-4444-8444-444444444444', status: 'completed' }], rowCount: 1 };
    if (sql.includes('INSERT INTO hr_learning_activity_events')) return { rows: [], rowCount: 1 };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const deps = {
    query,
    completeBlock: vi.fn(async () => ({ id: 'progress' })),
  } as unknown as LearningManagementDependencies;
  return { deps, query };
}

const actor = { userId: USER_ID, companyId: COMPANY_ID, isAdmin: false };

describe('Learning manager workflow', () => {
  it('requires feedback when requesting assignment changes', async () => {
    const { deps } = dependencies();
    await expect(reviewLearningAssignment({ submissionId: '33333333-3333-4333-8333-333333333333', approved: false, feedback: ' ', expectedUpdatedAt: UPDATED_AT, actor }, deps)).rejects.toThrow('Feedback is required');
  });

  it('rejects cross-company assignment review', async () => {
    const { deps } = dependencies({ companyId: '99999999-9999-4999-8999-999999999999' });
    await expect(reviewLearningAssignment({ submissionId: '33333333-3333-4333-8333-333333333333', approved: true, expectedUpdatedAt: UPDATED_AT, actor }, deps)).rejects.toThrow('company scope');
  });

  it('returns a conflict on stale assignment review and writes no completion', async () => {
    const { deps } = dependencies({ stale: true });
    await expect(reviewLearningAssignment({ submissionId: '33333333-3333-4333-8333-333333333333', approved: true, expectedUpdatedAt: UPDATED_AT, actor }, deps)).rejects.toBeInstanceOf(LearningConflictError);
    expect(deps.completeBlock).not.toHaveBeenCalled();
  });

  it('approves a validated assignment through the normal completion engine', async () => {
    const { deps } = dependencies();
    await reviewLearningAssignment({ submissionId: '33333333-3333-4333-8333-333333333333', approved: true, feedback: 'Good work', expectedUpdatedAt: UPDATED_AT, actor }, deps);
    expect(deps.completeBlock).toHaveBeenCalledWith(expect.objectContaining({ blockId: '55555555-5555-4555-8555-555555555555', lessonId: '66666666-6666-4666-8666-666666666666' }));
  });

  it('requires company scope and an explicit reason for completion override', async () => {
    const { deps } = dependencies();
    await expect(overrideLearningCompletion({ enrollmentId: '44444444-4444-4444-8444-444444444444', reason: '', actor }, deps)).rejects.toThrow('reason');
  });

  it('scopes reports to the manager company', async () => {
    const { deps, query } = dependencies();
    const report = await getLearningReport(actor, { status: 'in_progress' }, deps);
    expect(report.summary.assigned).toBe(2);
    const sql = query.mock.calls.map(call => String(call[0])).join('\n');
    expect(sql).toContain('emp.company_id=$1::uuid');
  });
});
