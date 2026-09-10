import { describe, expect, it } from 'vitest';

import { EMAIL_TEMPLATE_REQUIREMENTS } from './email-template-requirements';
import { formatEmailTemplateAttribute, getEmailTemplateAttributes } from './email-template-attributes';

describe('email template attribute guide', () => {
  it('provides a documented attribute set for every required template', () => {
    for (const template of EMAIL_TEMPLATE_REQUIREMENTS) {
      const attributes = getEmailTemplateAttributes(template.code);
      expect(attributes.length, template.code).toBeGreaterThan(0);
      expect(new Set(attributes.map(attribute => attribute.key)).size, template.code).toBe(attributes.length);
      expect(attributes.every(attribute => attribute.description.trim().length > 0), template.code).toBe(true);
    }
  });

  it('formats attributes using the email placeholder syntax', () => {
    expect(formatEmailTemplateAttribute('recipientName')).toBe('{{recipientName}}');
  });

  it('documents the exact legacy interview invitation attributes', () => {
    expect(getEmailTemplateAttributes('interview_invitation').map(attribute => attribute.key)).toEqual(
      expect.arrayContaining(['ApplicantName', 'positionTitle', 'evaluationLink', 'qrCodeBase64']),
    );
  });
});
