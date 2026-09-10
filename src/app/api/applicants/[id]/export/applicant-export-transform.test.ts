import { describe, expect, it } from 'vitest';
import {
  extractFromParsedData,
  formatAssignmentJustification,
  formatDateForExport,
  formatJobMatches,
  transformApplicantForExport,
  truncateForExcel,
} from './applicant-export-transform';

describe('applicant-export-transform', () => {
  it('formats dates, justifications, nested data, and job matches', () => {
    expect(formatDateForExport('2026-02-03T10:00:00.000Z')).toBe('2026-02-03');
    expect(formatAssignmentJustification(' first \n\n second ')).toBe('first; second');
    expect(formatAssignmentJustification(['a', '', 'b'])).toBe('a; b');
    expect(extractFromParsedData({ personal_info: { location: 'Bangkok' } }, 'personal_info.location')).toBe('Bangkok');
    expect(formatJobMatches([{ jobTitle: 'Engineer', fitScore: 0.876, matchReasons: ['React'] }]))
      .toBe('Job: Engineer | Score: 88% | Reasons: React');
  });

  it('truncates values for Excel and builds export rows', () => {
    expect(truncateForExcel('x'.repeat(40000))).toHaveLength(32767);

    const row = transformApplicantForExport({
      id: 'applicant-1',
      name: 'Ada',
      email: 'ada@example.com',
      fitScore: 0.913,
      statusName: null,
      applicationDate: '2026-01-02T00:00:00.000Z',
      parsedData: {
        personal_info: { location: 'Remote', introduction_aboutme: 'Hello' },
        skills: ['TypeScript'],
      },
      customAttributes: { seniority: 'Lead' },
    }, []);

    expect(row).toMatchObject({
      ID: 'applicant-1',
      'Name*': 'Ada',
      'Fit Score (0-100)': '91',
      'Status*': 'Unknown',
      'Application Date': '2026-01-02',
      Location: 'Remote',
      'Skills (JSON)': '["TypeScript"]',
      'Custom Attributes (JSON)': '{"seniority":"Lead"}',
    });
  });
});
