import { describe, expect, it } from 'vitest';

import { canExportApplicantsV1, getBearerToken } from './applicants-v1-export-auth';
import {
  buildApplicantsV1ExportCsv,
  formatAssignmentJustification,
  formatJobMatches,
} from './applicants-v1-export-format';

describe('v1 applicants export utilities', () => {
  it('extracts bearer tokens and checks export permission', () => {
    expect(getBearerToken('Bearer token-1')).toBe('token-1');
    expect(getBearerToken(null)).toBeNull();
    expect(canExportApplicantsV1({ role: 'Admin', modulePermissions: [] })).toBe(true);
    expect(canExportApplicantsV1({ role: 'User', modulePermissions: ['applicantS_EXPORT'] })).toBe(true);
    expect(canExportApplicantsV1({ role: 'User', modulePermissions: [] })).toBe(false);
    expect(canExportApplicantsV1(null)).toBe(false);
  });

  it('formats assignment justifications and job matches', () => {
    expect(formatAssignmentJustification(['a', '', 'b'])).toBe('a; b');
    expect(formatAssignmentJustification(' a \n\n b ')).toBe('a; b');
    expect(formatAssignmentJustification({})).toBe('');
    expect(formatJobMatches([
      { jobTitle: 'Engineer', fitScore: 0.876, matchReasons: ['React', 'Node'] },
    ])).toBe('Job: Engineer | Score: 88% | Reasons: React, Node');
  });

  it('builds escaped CSV content', () => {
    const csv = buildApplicantsV1ExportCsv([
      {
        id: 'applicant-1',
        name: 'Ana "Ace"',
        email: 'ana@example.com',
        positionTitle: 'Backend',
        assignmentJustification: ['Strong fit'],
        job_matches: [{ jobTitle: 'Backend', fitScore: 0.5, matchReasons: ['API'] }],
      },
    ]);

    expect(csv.split('\n')[0]).toContain('ID,Name,Email');
    expect(csv).toContain('"Ana ""Ace"""');
    expect(csv).toContain('"Strong fit"');
    expect(csv).toContain('"Job: Backend | Score: 50% | Reasons: API"');
  });
});
