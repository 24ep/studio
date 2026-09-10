import { describe, expect, it } from 'vitest';

import {
  buildHrResourceSchema,
  coerceHrFieldValue,
  getHrResourceConfig,
  getHrResourceKey,
} from './hr-resource-registry';

describe('hr resource registry', () => {
  it('accepts unlimited or non-negative whole headcount allocations only', () => {
    const schema = buildHrResourceSchema(getHrResourceConfig('teams'), true);
    expect(schema.safeParse({ headcountAllocation: null }).success).toBe(true);
    expect(schema.safeParse({ headcountAllocation: 0 }).success).toBe(true);
    expect(schema.safeParse({ headcountAllocation: 12 }).success).toBe(true);
    expect(schema.safeParse({ headcountAllocation: -1 }).success).toBe(false);
    expect(schema.safeParse({ headcountAllocation: 1.5 }).success).toBe(false);
  });

  it('maps payroll views to the correct resource', () => {
    expect(getHrResourceKey('payroll', 'payslips')).toBe('payslips');
    expect(getHrResourceKey('payroll', 'compensation')).toBe('compensation');
    expect(getHrResourceKey('payroll', 'periods')).toBe('payrollPeriods');
    expect(getHrResourceKey('payroll', 'items')).toBe('payrollRunItems');
    expect(getHrResourceKey('payroll', 'adjustments')).toBe('payrollAdjustments');
    expect(getHrResourceKey('payroll-runs')).toBe('payroll');
    expect(getHrResourceKey('payroll-reports', 'payslips')).toBe('payslips');
  });

  it('maps HR module resource views to their backing tables', () => {
    expect(getHrResourceConfig('clients').table).toBe('hr_clients');
    expect(getHrResourceConfig('onboarding', 'templates').table).toBe('hr_onboarding_templates');
    expect(getHrResourceConfig('onboarding', 'tasks').table).toBe('hr_onboarding_tasks');
    expect(getHrResourceConfig('attendance', 'schedules').table).toBe('hr_work_schedules');
    expect(getHrResourceConfig('attendance', 'shifts').table).toBe('hr_shift_assignments');
    expect(getHrResourceConfig('leave', 'policies').table).toBe('hr_leave_policies');
    expect(getHrResourceConfig('leave', 'balances').table).toBe('hr_leave_balances');
    expect(getHrResourceConfig('leave', 'blocks').table).toBe('hr_leave_blocks');
    expect(getHrResourceConfig('performance', 'cycles').table).toBe('hr_performance_cycles');
    expect(getHrResourceConfig('performance', 'goals').table).toBe('hr_performance_goals');
    expect(getHrResourceConfig('learning', 'courses').table).toBe('hr_learning_courses');
    expect(getHrResourceConfig('learning', 'paths').table).toBe('hr_learning_paths');
    expect(getHrResourceConfig('learning', 'certifications').table).toBe('hr_certifications');
    expect(getHrResourceConfig('benefits', 'enrollments').table).toBe('hr_employee_benefit_enrollments');
  });

  it('validates required employee fields', () => {
    const schema = buildHrResourceSchema(getHrResourceConfig('people'));
    expect(schema.safeParse({
      employeeNumber: 'EMP-001',
      firstName: 'Ari',
      lastName: 'Stone',
      email: 'ari@example.com',
      employmentType: 'full_time',
      status: 'active',
    }).success).toBe(true);

    expect(schema.safeParse({
      employeeNumber: '',
      firstName: 'Ari',
      lastName: 'Stone',
      email: 'not-email',
      employmentType: 'full_time',
      status: 'active',
    }).success).toBe(false);
  });

  it('exposes subcontract employment and the client assignment field', () => {
    const config = getHrResourceConfig('people');
    const employmentType = config.fields.find(field => field.name === 'employmentType');
    const clientId = config.fields.find(field => field.name === 'clientId');

    expect(employmentType?.options).toContain('subcontract');
    expect(clientId?.column).toBe('client_id');
  });

  it('allows trusted certificates without an employee ID', () => {
    const schema = buildHrResourceSchema(getHrResourceConfig('learning', 'certifications'));

    expect(schema.safeParse({
      name: 'Certified People Manager',
      issuer: 'People Institute',
      verificationUrl: 'https://credentials.example.test/verify',
      policyMetadata: { category: 'People Operations' },
      status: 'active',
      recordType: 'trusted',
      verificationStatus: 'verified',
    }).success).toBe(true);

    expect(schema.safeParse({
      name: 'Unverifiable certificate',
      issuer: 'Unknown issuer',
      verificationUrl: 'javascript:alert(1)',
      policyMetadata: { category: 'Other' },
      status: 'active',
      recordType: 'trusted',
      verificationStatus: 'verified',
    }).success).toBe(false);

    expect(schema.safeParse({
      name: 'Certified People Manager',
      status: 'active',
      recordType: 'employee',
      verificationStatus: 'pending',
    }).success).toBe(false);
  });

  it('coerces numbers, booleans, and dates for SQL writes', () => {
    expect(coerceHrFieldValue({ name: 'progress', column: 'progress', label: 'Progress', type: 'number' }, '42')).toBe(42);
    expect(coerceHrFieldValue({ name: 'isActive', column: 'is_active', label: 'Active', type: 'select' }, 'false')).toBe(false);
    expect(coerceHrFieldValue({ name: 'hireDate', column: 'hire_date', label: 'Hire date', type: 'date' }, '2026-07-22')).toEqual(new Date('2026-07-22'));
    expect(coerceHrFieldValue({ name: 'courseIds', column: 'course_ids', label: 'Courses', type: 'json' }, ['course-1'])).toBe('["course-1"]');
  });

  it('requires at least one valid course on a learning path', () => {
    const schema = buildHrResourceSchema(getHrResourceConfig('learning', 'paths'));
    const validCourseId = '00000000-0000-0000-0000-000000000001';

    expect(schema.safeParse({
      title: 'Manager foundation',
      status: 'active',
      courseIds: [validCourseId],
    }).success).toBe(true);

    expect(schema.safeParse({
      title: 'Empty path',
      status: 'draft',
      courseIds: [],
    }).success).toBe(false);
  });
});
