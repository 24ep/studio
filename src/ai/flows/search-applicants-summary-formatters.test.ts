import { describe, expect, it } from 'vitest';

import {
  appendIfPresent,
  buildApplicantDetailSummaryLines,
  buildCustomAttributeLines,
  formatFitScore,
  formatOptionalLine,
} from './search-applicants-summary-formatters';

describe('search applicants summary formatters', () => {
  it('formats optional lines and fit scores', () => {
    expect(formatFitScore(0.82)).toBe(82);
    expect(formatFitScore(72)).toBe(72);
    expect(formatOptionalLine('Location', '')).toBeNull();
    expect(formatOptionalLine('Location', 'Bangkok')).toBe('Location: Bangkok');

    const parts: string[] = [];
    appendIfPresent(parts, 'Email', 'ada@example.com');
    appendIfPresent(parts, 'Phone', null);
    expect(parts).toEqual(['Email: ada@example.com']);
  });

  it('builds applicant detail summary lines by section', () => {
    expect(buildApplicantDetailSummaryLines({
      cv_language: 'English',
      personal_info: {
        title_honorific: 'Dr.',
        nickname: 'Ada',
        location: 'Bangkok',
        introduction_aboutme: 'Builder',
      },
      education: [{
        university: 'Chula',
        major: 'Computer Science',
        field: 'AI',
        campus: 'Main',
        period: '2020-2024',
        duration: '4 years',
        GPA: '3.9',
      }],
      experience: [{
        company: 'Acme',
        position: 'Engineer',
        positionLevel: 'Senior',
        period: '2024-Present',
        duration: '2 years',
        isCurrent: true,
        description: 'x'.repeat(260),
      }],
      skills: [{
        segment_skill: 'Backend',
        skill: ['TypeScript', 'Node'],
      }],
      job_matches: [{
        jobTitle: 'Platform Engineer',
        fitScore: 0.91,
        matchReasons: ['API', 'Systems'],
      }],
    } as never)).toEqual([
      'CV Language: English',
      'Title: Dr.',
      'Nickname: Ada',
      'Location: Bangkok',
      'About Me: Builder',
      'Education History:',
      '  1. University: Chula, Major/Field: Computer Science / AI, Campus: Main, Period: 2020-2024, Duration: 4 years, GPA: 3.9',
      'Work Experience:',
      `  1. Company: Acme, Position: Engineer (Level: Senior), Period: 2024-Present, Duration: 2 years (Current Position)\n    Description: ${'x'.repeat(250)}...`,
      'Skills:',
      '  - Segment: Backend: TypeScript, Node',
      'Automated Job Matches (from automation):',
      '  - Job: Platform Engineer, Fit: 91%, Reasons: API, Systems',
    ]);
  });

  it('formats custom attributes safely', () => {
    expect(buildCustomAttributeLines({
      location: 'Bangkok',
      metadata: { source: 'import' },
    } as never)).toEqual([
      'Custom Attributes:',
      '  location: Bangkok',
      '  metadata: {"source":"import"}',
    ]);
    expect(buildCustomAttributeLines(null)).toEqual([]);
  });
});
