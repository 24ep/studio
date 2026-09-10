import { describe, expect, it } from 'vitest';

import { hrisApprovalTaskMatches } from './HrisApprovalInbox';

const task = {
  title: 'Nicha S.',
  meta: 'Leave request · submitted 01 Aug 2026',
  type: 'Leave request',
};

describe('hrisApprovalTaskMatches', () => {
  it('matches employee names without case sensitivity', () => {
    expect(hrisApprovalTaskMatches(task, 'NICHA')).toBe(true);
  });

  it('matches request type and metadata', () => {
    expect(hrisApprovalTaskMatches(task, 'leave')).toBe(true);
    expect(hrisApprovalTaskMatches(task, 'aug 2026')).toBe(true);
  });

  it('returns every task for an empty query', () => {
    expect(hrisApprovalTaskMatches(task, '   ')).toBe(true);
  });

  it('rejects unrelated queries', () => {
    expect(hrisApprovalTaskMatches(task, 'expense')).toBe(false);
  });
});
