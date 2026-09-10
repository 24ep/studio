import { describe, expect, it } from 'vitest';

import { editApplicantDetailSchema } from './use-applicant-detail-edit-form-schema';

describe('use-applicant-detail-edit-form-schema', () => {
  it('accepts parsed applicant edit values with typed arrays', () => {
    const parsed = editApplicantDetailSchema.parse({
      email: 'ada@example.com',
      fitScore: 0.82,
      parsedData: {
        personal_info: { firstname: 'Ada' },
        education: [{ university: 'Oxford', startYear: 1840 }],
        experience: [{ company: 'Analytical Engines', isCurrent: true }],
        skills: [{ skill_string: 'Mathematics' }],
        job_suitable: [{ jobId: 'position-1' }],
        job_matches: [{ jobId: 'position-2' }],
      },
    });

    expect(parsed.parsedData?.personal_info?.firstname).toBe('Ada');
    expect(parsed.parsedData?.education?.[0].startYear).toBe(1840);
  });

  it('rejects invalid scalar field types', () => {
    expect(() => editApplicantDetailSchema.parse({
      fitScore: 'high',
    })).toThrow();
  });
});
