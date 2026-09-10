import { describe, expect, it } from 'vitest';

import {
  calculateProfileCompletion,
  calculateProfileCompletionBreakdown,
  createHumanRequestId,
  essPerformanceActionSchema,
  essRequestActionSchema,
  essRequestCreateSchema,
  getEssRequestTransition,
  maskSensitiveValue,
} from './ess-contracts';

describe('ESS request contracts', () => {
  it('masks sensitive values without exposing the full source', () => {
    expect(maskSensitiveValue('1234567890')).toBe('••••••7890');
    expect(maskSensitiveValue('123')).toBe('••••');
  });

  it('creates stable human-readable request identifiers', () => {
    expect(createHumanRequestId('PCR', '12345678-1234-1234-1234-123456789abc')).toBe('PCR-1234567812');
  });

  it('supports return and resubmission while blocking invalid transitions', () => {
    expect(getEssRequestTransition('return_for_revision', 'pending_approval')).toBe('returned_for_revision');
    expect(getEssRequestTransition('resubmit', 'returned_for_revision')).toBe('pending_approval');
    expect(getEssRequestTransition('approve', 'draft')).toBeNull();
  });

  it('requires comments for high-risk negative approval actions', () => {
    const base = { id: '00000000-0000-0000-0000-000000000001', expectedVersion: 1 };
    expect(essRequestActionSchema.safeParse({ ...base, action: 'reject' }).success).toBe(false);
    expect(essRequestActionSchema.safeParse({ ...base, action: 'reject', comment: 'Not supported by policy' }).success).toBe(true);
  });

  it('validates profile, attendance, and document requests', () => {
    expect(essRequestCreateSchema.safeParse({
      requestType: 'profile_change',
      title: 'Update address',
      reason: 'Moved to a new home',
      values: { address: { city: 'Bangkok' } },
      originalValues: {},
      saveAsDraft: false,
    }).success).toBe(true);
    expect(essRequestCreateSchema.safeParse({
      requestType: 'attendance_correction',
      title: 'Correct attendance',
      reason: 'Device was offline',
      values: {
        workDate: '2026-07-28',
        clockIn: '2026-07-28T10:00:00.000Z',
        clockOut: '2026-07-28T09:00:00.000Z',
        breakMinutes: 0,
      },
      originalValues: {},
      saveAsDraft: false,
    }).success).toBe(false);
  });

  it('enforces performance workflow versions and assessment length', () => {
    expect(essPerformanceActionSchema.safeParse({
      action: 'submit_self_assessment',
      id: '00000000-0000-0000-0000-000000000001',
      selfAssessment: 'Too short',
      expectedVersion: 1,
    }).success).toBe(false);
  });

  it('calculates profile completion across all employee profile attributes', () => {
    expect(calculateProfileCompletion({
      employeeNumber: 'EMP-1',
      firstName: 'Mika',
      lastName: 'Chen',
      preferredName: 'Mika', bankInformation: { accountNumber: 'masked' },
    })).toBe(14);
  });

  it('only includes conditional employment attributes when applicable', () => {
    const base = Object.fromEntries([
      'employeeNumber', 'firstName', 'lastName', 'preferredName', 'legalName',
      'email', 'phone', 'location', 'personalEmail', 'personalPhone',
      'personalLocation', 'introduction', 'jobTitle', 'employmentType', 'status',
      'hireDate', 'departmentId', 'managerId', 'positionId', 'companyId',
      'businessUnit', 'workPhone', 'profilePhotoUrl', 'personalInformation',
      'address', 'emergencyContacts', 'familyDependents', 'bankInformation',
      'taxInformation', 'governmentIdentification', 'education', 'workExperience',
      'skills', 'certifications', 'languages',
    ].map(key => [key, key === 'employmentType' ? 'full_time' : key === 'status' ? 'active' : 'complete']));

    expect(calculateProfileCompletion(base)).toBe(100);
    expect(calculateProfileCompletion({ ...base, employmentType: 'subcontract' })).toBe(95);
  });

  it('reports required and optional profile completion separately', () => {
    const values = {
      employeeNumber: 'EMP-1', firstName: 'Mika', lastName: 'Chen', email: 'mika@example.com',
      employmentType: 'full_time', status: 'active', hireDate: '2026-01-01',
      departmentId: 'department', positionId: 'position', companyId: 'company',
      preferredName: 'Mika', bankInformation: { accountNumber: 'masked' },
    };

    expect(calculateProfileCompletionBreakdown(values)).toEqual({ required: 100, optional: 4 });
  });
});
