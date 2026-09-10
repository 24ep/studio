import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  promoteBuiltInApplicantDetails,
  normalizeBuiltInApplicant,
  normalizeBuiltInJobMatches,
  parseBuiltInResumeProcessorJson,
} from './built-in-resume-processor-utils';

describe('built-in resume processor normalization', () => {
  it('parses fenced JSON responses', () => {
    expect(parseBuiltInResumeProcessorJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('repairs common malformed JSON returned by the AI', () => {
    expect(parseBuiltInResumeProcessorJson(`{
      "applicant": {
        "name": "Ada \"Countess of Lovelace\"",
        "email": "ada@example.com",
      },
      "job_matches": []
    }`)).toEqual({
      applicant: {
        name: 'Ada "Countess of Lovelace"',
        email: 'ada@example.com',
      },
      job_matches: [],
    });
  });

  it('repairs JSON surrounded by model commentary', () => {
    expect(parseBuiltInResumeProcessorJson('Result follows:\n{"applicant":{"name":"Ada" "email":"ada@example.com"}}\nDone.')).toEqual({
      applicant: { name: 'Ada', email: 'ada@example.com' },
    });
  });

  it('normalizes applicant data from compact processor JSON', () => {
    const applicant = normalizeBuiltInApplicant({
      applicant: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+1 555 0100',
        fitScore: '88',
        parsedData: { skills: ['analysis'] },
      },
    }, 'ada-resume.pdf');

    expect(applicant).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+1 555 0100',
      fitScore: 88,
    });
    expect(applicant.parsedData.skills).toEqual(['analysis']);
    expect(applicant.parsedData.built_in_resume_processor).toBeTruthy();
  });

  it('falls back to applicant_info and target position job match', () => {
    const applicant = normalizeBuiltInApplicant({
      applicant_info: {
        personal_info: { firstname: 'Grace', lastname: 'Hopper' },
        contact_info: { email: 'grace@example.com' },
      },
    }, 'resume.docx');
    const matches = normalizeBuiltInJobMatches({}, '00000000-0000-0000-0000-000000000001');

    expect(applicant.name).toBe('Grace Hopper');
    expect(applicant.email).toBe('grace@example.com');
    expect(applicant.parsedData).toMatchObject({
      personal_info: { firstname: 'Grace', lastname: 'Hopper' },
      contact_info: { email: 'grace@example.com' },
    });
    expect(matches).toEqual([{
      jobId: '00000000-0000-0000-0000-000000000001',
      jobTitle: null,
      fitScore: null,
      matchReasons: [],
      job_description_summary: null,
    }]);
  });

  it('stores nested AI resume details at the top level used by applicant tabs', () => {
    const applicant = normalizeBuiltInApplicant({
      applicant: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        parsedData: {
          personal_info: {
            firstname: 'Ada',
            lastname: 'Lovelace',
            location: 'London',
          },
          contact_info: { email: 'ada@example.com' },
          education: [{ university: 'University of London' }],
          experience: [{ company: 'Analytical Engines Ltd.' }],
          skills: [{ segment_skill: 'Engineering', skill: ['Mathematics'] }],
        },
      },
    }, 'ada.pdf');

    expect(applicant.parsedData).toMatchObject({
      personal_info: { firstname: 'Ada', lastname: 'Lovelace', location: 'London' },
      contact_info: { email: 'ada@example.com' },
      education: [{ university: 'University of London' }],
      experience: [{ company: 'Analytical Engines Ltd.' }],
      skills: [{ segment_skill: 'Engineering', skill: ['Mathematics'] }],
    });
  });

  it('promotes details from legacy built-in processor payloads', () => {
    expect(promoteBuiltInApplicantDetails({
      built_in_resume_processor: {
        applicant_info: {
          personal_info: { firstname: 'Grace', lastname: 'Hopper' },
          contact_info: { email: 'grace@example.com' },
          education: [{ university: 'Yale' }],
        },
      },
    })).toMatchObject({
      personal_info: { firstname: 'Grace', lastname: 'Hopper' },
      contact_info: { email: 'grace@example.com' },
      education: [{ university: 'Yale' }],
    });
  });

  it('does not insert nonexistent createdAt column into attachments', () => {
    const processorSource = readFileSync(
      join(process.cwd(), 'src/lib/upload-queue/built-in-resume-processor.ts'),
      'utf8',
    );

    expect(processorSource).not.toContain('"Attachment" (id, "applicantId", "uploadedById", "filePath", "fileName", label, "isPrimary", "uploadedAt", "createdAt"');
    expect(processorSource).toContain('"Attachment" (id, "applicantId", "uploadedById", "filePath", "fileName", label, "isPrimary", "uploadedAt", "updatedAt"');
  });
});
