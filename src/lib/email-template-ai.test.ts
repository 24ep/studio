import { describe, expect, it } from 'vitest';

import {
  buildEmailTemplateAiPrompt,
  findUnsupportedEmailTemplateAttributes,
  parseGeneratedEmailTemplate,
} from './email-template-ai';

describe('email template AI helpers', () => {
  it('builds a constrained prompt with exact template attributes', () => {
    const prompt = buildEmailTemplateAiPrompt({
      name: 'Interview invitation',
      description: 'Invite a candidate to an interview.',
      tone: 'warm-professional',
      instructions: 'Keep it brief.',
      attributes: [{ key: 'ApplicantName', description: "Applicant's name" }],
    });

    expect(prompt).toContain('{{ApplicantName}}');
    expect(prompt).toContain('Keep it brief.');
    expect(prompt).toContain('Return valid JSON only');
  });

  it('parses plain and fenced JSON responses', () => {
    expect(parseGeneratedEmailTemplate('{"subject":"Hello","html":"<p>Hi</p>"}')).toEqual({
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
    expect(parseGeneratedEmailTemplate('```json\n{"subject":"Hello","html":"<p>Hi</p>"}\n```').subject).toBe('Hello');
  });

  it('rejects incomplete AI output', () => {
    expect(() => parseGeneratedEmailTemplate('{"subject":"Hello"}')).toThrow('incomplete');
  });

  it('detects placeholders outside the attribute guide', () => {
    expect(findUnsupportedEmailTemplateAttributes({
      subject: 'Hello {{ApplicantName}}',
      html: '<p>{{ApplicantName}} {{madeUpValue}}</p>',
    }, ['ApplicantName'])).toEqual(['madeUpValue']);
  });
});
