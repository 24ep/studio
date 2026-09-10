import { describe, expect, it } from 'vitest';

import { hrisStatusTone } from './HrisWorkspacePrimitives';

describe('hrisStatusTone', () => {
  it('uses the success treatment for completed workflow states', () => {
    expect(hrisStatusTone('approved')).toContain('emerald');
    expect(hrisStatusTone('published')).toContain('emerald');
    expect(hrisStatusTone('exported_to_payroll')).toContain('emerald');
    expect(hrisStatusTone('reconciled')).toContain('emerald');
    expect(hrisStatusTone('posted')).toContain('emerald');
  });

  it('uses the destructive treatment for failed or blocked states', () => {
    expect(hrisStatusTone('failed')).toContain('rose');
    expect(hrisStatusTone('blocked')).toContain('rose');
    expect(hrisStatusTone('overdue')).toContain('rose');
    expect(hrisStatusTone('posting_failed')).toContain('rose');
    expect(hrisStatusTone('exceptions_pending')).toContain('rose');
  });

  it('distinguishes active work from waiting states', () => {
    expect(hrisStatusTone('in_progress')).toContain('blue');
    expect(hrisStatusTone('working_remotely')).toContain('blue');
    expect(hrisStatusTone('payment_processing')).toContain('blue');
    expect(hrisStatusTone('ready_for_review')).toContain('blue');
    expect(hrisStatusTone('pending_approval')).toContain('amber');
  });

  it('uses the neutral treatment for inactive historical states', () => {
    expect(hrisStatusTone('draft')).toContain('muted');
    expect(hrisStatusTone('archived')).toContain('muted');
    expect(hrisStatusTone('not_started')).toContain('muted');
  });
});
