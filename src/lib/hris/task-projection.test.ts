import { describe, expect, it } from 'vitest';

import { mapHrisTaskRow } from './task-projection';

describe('HRIS task projection', () => {
  it('maps database rows without exposing routing metadata through allowed decisions', () => {
    const task = mapHrisTaskRow({
      id: 'task-1', task_type: 'leave_approval', source_domain: 'leave', source_type: 'request', source_id: 'leave-1',
      subject: 'Approve annual leave', priority: 'high', status: 'pending_approval', deep_link: '/workforce/leave',
      allowed_decisions: ['approve', 'reject'], decision_handlers: { approve: { kind: 'hr_workflow', action: 'approve_leave' } },
      version: 2, created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T01:00:00.000Z',
    });
    expect(task.allowedDecisions).toEqual(['approve', 'reject']);
    expect(task.decisionHandlers.approve).toMatchObject({ kind: 'hr_workflow' });
    expect(task.version).toBe(2);
  });
});
