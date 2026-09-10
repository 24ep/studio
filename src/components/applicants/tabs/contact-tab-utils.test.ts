import { describe, expect, it } from 'vitest';

import {
  getApplicantContactInfo,
  getApplicantSkills,
  getContactSkillKey,
  getSkillLabels,
} from './contact-tab-utils';

describe('contact tab utilities', () => {
  it('normalizes contact info fields from parsed applicant data', () => {
    expect(getApplicantContactInfo({
      contact_info: {
        email: 'ada@example.com',
        phone: '123-456',
        ignoredNumber: 42,
      },
    })).toMatchObject({
      email: 'ada@example.com',
      phone: '123-456',
      ignoredNumber: 42,
    });

    expect(getApplicantContactInfo({ contact_info: 'invalid' })).toEqual({});
  });

  it('normalizes skills from arrays and comma-separated strings', () => {
    expect(getApplicantSkills({
      skills: [
        {
          segment_skill: 'Frontend',
          skill: ['React', 10, 'TypeScript'],
        },
        {
          segment_skill: 'Backend',
          skill_string: 'Node.js, SQL',
        },
        'invalid',
      ],
    })).toEqual([
      {
        segment_skill: 'Frontend',
        skill: ['React', 'TypeScript'],
        skill_string: undefined,
      },
      {
        segment_skill: 'Backend',
        skill: undefined,
        skill_string: 'Node.js, SQL',
      },
    ]);
  });

  it('builds display skill labels with trimming and array preference', () => {
    expect(getSkillLabels({
      skill: [' React ', '', 'TypeScript'],
      skill_string: 'Should not be used',
    })).toEqual(['React', 'TypeScript']);

    expect(getSkillLabels({ skill_string: 'Node.js, SQL, ' })).toEqual(['Node.js', 'SQL']);
  });

  it('uses stable field ids for editable skill rows', () => {
    expect(getContactSkillKey({ field_id: 'field-1', id: 'id-1' }, 0)).toBe('field-1');
    expect(getContactSkillKey({ id: 'id-1' }, 0)).toBe('id-1');
    expect(getContactSkillKey({}, 2)).toBe('skill-2');
  });
});
