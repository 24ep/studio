import { describe, expect, it } from 'vitest';
import { payrollActionSchema } from './contracts';

describe('payroll contracts', () => {
  it('accepts idempotent regular-run creation', () => {
    expect(payrollActionSchema.parse({
      action: 'create_run',
      periodId: '00000000-0000-4000-8000-000000000001',
      runType: 'regular',
      idempotencyKey: 'company-period-regular',
    }).action).toBe('create_run');
  });

  it('requires an optimistic version and reason for run transitions', () => {
    expect(payrollActionSchema.safeParse({
      action: 'finalize',
      runId: '00000000-0000-4000-8000-000000000001',
    }).success).toBe(false);
  });

  it('rejects negative compensation proposals', () => {
    expect(payrollActionSchema.safeParse({
      action: 'create_change',
      employeeId: '00000000-0000-4000-8000-000000000001',
      changeType: 'merit',
      proposedAmount: -1,
      effectiveDate: '2026-08-01',
      reason: 'Annual review',
    }).success).toBe(false);
  });

  it('accepts an explicit payslip release transition', () => {
    expect(payrollActionSchema.parse({
      action: 'release_payslips',
      runId: '00000000-0000-4000-8000-000000000001',
      expectedVersion: 3,
      reason: 'Payroll owner confirmed employee release',
    }).action).toBe('release_payslips');
  });

  it('accepts a scoped payroll-profile assignment', () => {
    expect(payrollActionSchema.parse({
      action: 'assign_payroll_profile',
      employeeId: '00000000-0000-4000-8000-000000000001',
      payrollGroupId: '00000000-0000-4000-8000-000000000002',
      paymentMethod: 'bank_transfer',
      paymentCurrency: 'thb',
      payrollStartDate: '2026-08-11',
      bankAccountReference: 'PAY-0001',
    })).toMatchObject({ action: 'assign_payroll_profile', paymentCurrency: 'THB' });
  });

  it('normalizes legacy check payroll groups to cheque', () => {
    expect(payrollActionSchema.parse({
      action: 'create_group',
      code: 'TH-CHECK',
      name: 'Cheque employees',
      paymentMethod: 'check',
    })).toMatchObject({ action: 'create_group', paymentMethod: 'cheque' });
  });

  it('normalizes legacy check profile assignments to cheque', () => {
    expect(payrollActionSchema.parse({
      action: 'assign_payroll_profile',
      employeeId: '00000000-0000-4000-8000-000000000001',
      payrollGroupId: '00000000-0000-4000-8000-000000000002',
      paymentMethod: 'check',
      payrollStartDate: '2026-08-11',
    })).toMatchObject({ action: 'assign_payroll_profile', paymentMethod: 'cheque' });
  });

  it('accepts rule-based multi-employee benefit enrollment', () => {
    expect(payrollActionSchema.parse({
      action: 'enroll',
      benefitPlanId: '00000000-0000-4000-8000-000000000010',
      employeeIds: [
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
      ],
      effectiveFrom: '2026-09-01',
      enrollmentMode: 'rules',
      reason: 'Eligible population reviewed',
    })).toMatchObject({ action: 'enroll', enrollmentMode: 'rules' });
  });

  it('accepts complete benefit plan eligibility configuration', () => {
    expect(payrollActionSchema.parse({
      action: 'update_plan',
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Health Plus',
      type: 'health_insurance',
      providerCode: 'Bumrungrad Health',
      description: 'IPD and OPD coverage',
      employerCost: 8000,
      employeeCost: 2400,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      isActive: true,
      eligibilityRules: { employmentTypes: ['full_time'], minimumServiceMonths: 3 },
      reason: 'Annual plan update',
    })).toMatchObject({ action: 'update_plan', isActive: true });
  });
});
