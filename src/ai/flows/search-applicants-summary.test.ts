import { describe, expect, it, vi } from 'vitest';

import type { Applicant } from '@/lib/types';
import {
  buildApplicantSummariesText,
  createApplicantSummary,
} from './search-applicants-summary';

vi.mock('@/lib/recruitmentStageUtils', () => ({
  getRecruitmentStageName: vi.fn(async (stage: string) => (
    stage === 'screening' ? 'Screening' : null
  )),
}));

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: 'applicant-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '123',
    parsedData: null,
    positionId: 'position-1',
    position: {
      id: 'position-1',
      title: 'Engineer',
      department: 'Product',
      isOpen: true,
    },
    fitScore: 0.82,
    statusId: 'screening',
    status: 'screening',
    applicationDate: '2026-01-02T00:00:00Z',
    recruiter: { id: 'user-1', name: 'Grace', email: 'grace@example.com' },
    transitionHistory: [
      { id: 'older', stage: 'applied', date: '2026-01-01T00:00:00Z' },
      { id: 'newer', stage: 'screening', date: '2026-01-03T00:00:00Z' },
    ],
    ...overrides,
  } as Applicant;
}

describe('search applicant summaries', () => {
  it('builds applicant summary text with core profile, details, and latest transition', async () => {
    const summary = await createApplicantSummary(makeApplicant({
      parsedData: {
        cv_language: 'English',
        personal_info: {
          firstname: 'Ada',
          lastname: 'Lovelace',
          title_honorific: 'Dr.',
          nickname: 'Ada',
          location: 'London',
          introduction_aboutme: 'Analytical builder',
        },
        contact_info: { email: 'ada@example.com' },
        education: [{ university: 'University', major: 'Math', GPA: '4.0' }],
        experience: [{
          company: 'Analytical Engines',
          position: 'Engineer',
          period: 'Jan 2020 - Present',
          isCurrent: true,
          description: 'Built systems',
        }],
        skills: [{ segment_skill: 'Frontend', skill: ['React', 'TypeScript'] }],
        job_matches: [{ jobTitle: 'Engineer', fitScore: 0.9, matchReasons: ['Strong skills'] }],
      },
      customAttributes: { department: 'R&D' },
    }));

    expect(summary).toContain('Applicant ID: applicant-1');
    expect(summary).toContain('Applied for Position: Engineer (Fit Score: 82%, Status: Screening)');
    expect(summary).toContain('Last Status Update: Screening');
    expect(summary).toContain('CV Language: English');
    expect(summary).toContain('Education History:');
    expect(summary).toContain('Work Experience:');
    expect(summary).toContain('Skills:');
    expect(summary).toContain('Automated Job Matches');
    expect(summary).toContain('department: R&D');
  });

  it('wraps multiple applicant summaries with delimiters', async () => {
    await expect(buildApplicantSummariesText([
      makeApplicant({ id: 'applicant-1', name: 'Ada' }),
      makeApplicant({ id: 'applicant-2', name: 'Grace' }),
    ])).resolves.toContain('Applicant_END\n\n---\n\nApplicant_START');
  });
});
