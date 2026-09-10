import { describe, expect, it } from 'vitest';

import {
  DEFAULT_INTERVIEW_INVITATION_SUBJECT,
  DEFAULT_INTERVIEW_INVITATION_TEMPLATE,
  TEMPLATE_VARIABLES,
  buildTemplateVariablesSummary
} from './email-templates-tab-utils';

describe('email template tab utilities', () => {
  it('keeps reset defaults aligned with required template variables', () => {
    expect(DEFAULT_INTERVIEW_INVITATION_SUBJECT).toContain('{{ApplicantName}}');
    expect(DEFAULT_INTERVIEW_INVITATION_SUBJECT).toContain('{{positionTitle}}');

    for (const { token } of TEMPLATE_VARIABLES) {
      expect(buildTemplateVariablesSummary()).toContain(`{{${token}}}`);
    }

    expect(DEFAULT_INTERVIEW_INVITATION_TEMPLATE).toContain('{{evaluationLink}}');
    expect(DEFAULT_INTERVIEW_INVITATION_TEMPLATE).toContain('{{evaluationQrcodeImage}}');
  });
});
