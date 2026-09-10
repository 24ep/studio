import { describe, expect, it } from 'vitest';

import { convertToCsv, transformApplicantForExport } from './applicants-export-format';
import { getApplicantsExportColumns } from './applicants-export-workbook';

describe('applicants-export-format', () => {
  it('builds applicant rows with optional job matches and parsed profile fields', () => {
    const row = transformApplicantForExport({
      id: 'applicant-1',
      name: 'Ada',
      email: 'ada@example.com',
      fitScore: 0,
      status_name: null,
      applicationDate: '2026-01-02T00:00:00.000Z',
      assignmentJustification: ' first \n\n second ',
      job_matches: [{ jobTitle: 'Engineer', fitScore: 0.876, matchReasons: ['React'] }],
      parsedData: {
        personal_info: { location: 'Remote', introduction_aboutme: 'Hello' },
        skills: ['TypeScript'],
      },
      customAttributes: { seniority: 'Lead' },
    }, true);

    expect(row).toMatchObject({
      ID: 'applicant-1',
      'Name*': 'Ada',
      'Fit Score (0-100)': '0',
      'Status*': 'Unknown',
      'Application Date': '2026-01-02',
      'Applied Job Justification': 'first; second',
      'Job Matches': 'Job: Engineer | Score: 88% | Reasons: React',
      Location: 'Remote',
      'Skills (JSON)': '["TypeScript"]',
      'Custom Attributes (JSON)': '{"seniority":"Lead"}',
    });
  });

  it('omits job match columns when the feature is disabled', () => {
    const row = transformApplicantForExport({
      id: 'applicant-1',
      job_matches: [{ jobTitle: 'Engineer' }],
    }, false);

    expect(row).not.toHaveProperty('Job Matches');
    expect(getApplicantsExportColumns(false).map(column => column.key)).not.toContain('Job Matches');
    expect(getApplicantsExportColumns(true).map(column => column.key)).toContain('Job Matches');
  });

  it('escapes csv values', () => {
    expect(convertToCsv([
      { Name: 'Ada "Countess"', Notes: 'first, second' },
    ])).toBe('Name,Notes\n"Ada ""Countess""","first, second"');
  });
});
