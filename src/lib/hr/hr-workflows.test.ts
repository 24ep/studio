import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRawUnsafe: vi.fn(),
  },
}));

import { getHrWorkflowDefinition, HR_WORKFLOW_DEFINITIONS } from './hr-workflows';

describe('HR workflow definitions', () => {
  it('maps common HRIS actions to protected HR modules', () => {
    expect(getHrWorkflowDefinition('approve_leave')?.moduleKey).toBe('leave');
    expect(getHrWorkflowDefinition('process_payroll')?.moduleKey).toBe('payroll-runs');
    expect(getHrWorkflowDefinition('publish_payslip')?.moduleKey).toBe('payslips');
  });

  it('keeps workflow actions unique', () => {
    const actions = HR_WORKFLOW_DEFINITIONS.map(definition => definition.action);
    expect(new Set(actions).size).toBe(actions.length);
  });
});
