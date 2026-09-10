import { describe, expect, it } from 'vitest';

import { EMAIL_TEMPLATE_REQUIREMENTS } from './email-template-requirements';

describe('email template requirements', () => {
  it('defines a unique, required application-owned catalog', () => {
    const codes = EMAIL_TEMPLATE_REQUIREMENTS.map(requirement => requirement.code);

    expect(new Set(codes).size).toBe(codes.length);
    expect(EMAIL_TEMPLATE_REQUIREMENTS.every(requirement => requirement.required)).toBe(true);
    expect(codes).toEqual(expect.arrayContaining([
      'application_received',
      'interview_invitation',
      'offer_letter',
      'employee_password_setup',
      'employee_survey_invitation',
      'payslip_available',
      'training_due_reminder',
      'expense_status_changed',
      'termination_notice',
    ]));
  });
});
