import { describe, expect, it } from 'vitest';

import {
  buildCreateApplicantRequest,
  createAddApplicantDefaultValues,
  createEducationDefaults,
  createExperienceDefaults,
  createOpenAddApplicantDefaultValues,
  PLACEHOLDER_VALUE_NONE,
  prepareAddApplicantSubmission,
  type AddApplicantFormValues,
} from './add-applicant-modal-form';
import type { RecruitmentStage } from '@/lib/types';

const appliedStageId = '11111111-1111-4111-8111-111111111111';
const screeningStageId = '22222222-2222-4222-8222-222222222222';
const positionId = '33333333-3333-4333-8333-333333333333';

const stages: RecruitmentStage[] = [
  { id: screeningStageId, name: 'Screening', isSystem: false },
  { id: appliedStageId, name: 'Applied', isSystem: true },
];

function makeFormValues(overrides: Partial<AddApplicantFormValues> = {}): AddApplicantFormValues {
  return {
    cv_language: 'en',
    personal_info: { firstname: 'Mila', lastname: 'Chen' },
    contact_info: { email: 'mila@example.com', phone: '123' },
    education: [],
    experience: [{
      company: 'Acme',
      position: 'Engineer',
      startMonth: 1,
      startYear: 2022,
      endMonth: null,
      endYear: null,
      isCurrent: true,
      description: '',
      positionLevel: PLACEHOLDER_VALUE_NONE,
    }],
    skills: [{ segment_skill: 'Languages', skill_string: 'TypeScript' }],
    job_suitable: [],
    positionId,
    status: appliedStageId,
    fitScore: 85,
    applicationDate: '2024-05-06',
    ...overrides,
  };
}

describe('add applicant modal form helpers', () => {
  it('uses the Applied stage id and current date in defaults', () => {
    const date = new Date('2024-05-06T12:00:00.000Z');

    expect(createAddApplicantDefaultValues(stages, date)).toMatchObject({
      status: appliedStageId,
      applicationDate: '2024-05-06',
      experience: [],
      skills: [{ segment_skill: '', skill_string: '' }],
    });

    expect(createOpenAddApplicantDefaultValues(stages, date).experience).toEqual([
      expect.objectContaining({
        startMonth: 5,
        startYear: 2024,
        isCurrent: true,
      }),
    ]);
  });

  it('creates repeatable field-array defaults', () => {
    const date = new Date('2024-05-06T12:00:00.000Z');

    expect(createEducationDefaults(date)).toMatchObject({
      university: '',
      startMonth: 5,
      startYear: 2024,
      isCurrent: false,
    });
    expect(createExperienceDefaults(date)).toMatchObject({
      company: '',
      startMonth: 5,
      startYear: 2024,
      isCurrent: false,
      positionLevel: null,
    });
  });

  it('normalizes fit score percentages and placeholder position levels', () => {
    expect(prepareAddApplicantSubmission(makeFormValues())).toMatchObject({
      fitScore: 0.85,
      experience: [expect.objectContaining({ positionLevel: null })],
    });
  });

  it('builds the nested API payload expected by the applicant route', () => {
    expect(buildCreateApplicantRequest(makeFormValues())).toEqual({
      applicant_info: {
        cv_language: 'en',
        personal_info: { firstname: 'Mila', lastname: 'Chen' },
        contact_info: { email: 'mila@example.com', phone: '123' },
        education: [],
        experience: [expect.objectContaining({ positionLevel: null })],
        skills: [{ segment_skill: 'Languages', skill_string: 'TypeScript' }],
        job_suitable: [],
        status: appliedStageId,
      },
      job_matches: [],
      job_applied: {
        jobId: positionId,
        fitScore: 0.85,
      },
      applicationDate: '2024-05-06',
      sourceId: null,
      subSource: null,
      customAttributes: {},
      assignmentJustification: null,
    });
  });

  it('includes all manually editable application attributes', () => {
    expect(buildCreateApplicantRequest(makeFormValues({
      sourceId: '44444444-4444-4444-8444-444444444444',
      subSource: 'Employee referral',
      assignmentJustification: 'Strong domain experience\nExcellent communication',
      customAttributes: '{"portfolioUrl":"https://example.com"}',
    }))).toMatchObject({
      sourceId: '44444444-4444-4444-8444-444444444444',
      subSource: 'Employee referral',
      assignmentJustification: 'Strong domain experience\nExcellent communication',
      customAttributes: { portfolioUrl: 'https://example.com' },
      job_applied: {
        justification: ['Strong domain experience', 'Excellent communication'],
      },
    });
  });
});
