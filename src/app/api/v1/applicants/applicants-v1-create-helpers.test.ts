import { describe, expect, it } from 'vitest';
import { cleanPayload, buildApplicantCreatePayload } from './applicants-v1-payload';
import { asLogDetails, createApplicantResponse } from './applicants-v1-create-response';
import type { CreateApplicantInput } from './applicants-v1-schema';

describe('v1 applicant create helpers', () => {
  it('cleans nested payload values before validation', () => {
    expect(cleanPayload({
      name: '  Ada  ',
      empty: '',
      email: ' ADA@EXAMPLE.COM ',
      nested: {
        isCurrent: 'true',
        title: '  Engineer ',
      },
    })).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      nested: {
        isCurrent: true,
        title: 'Engineer',
      },
    });
  });

  it('builds applicant create payload from normalized input', () => {
    const positionId = '550e8400-e29b-41d4-a716-446655440000';
    const input: CreateApplicantInput = {
      applicant_info: {
        personal_info: {
          firstname: 'Ada',
          lastname: 'Lovelace',
        },
        contact_info: {
          email: 'ada@example.com',
          phone: '+123',
        },
        job_matches: [{ jobId: positionId }],
      },
      educationData: [],
      experienceData: [],
      job_applied: null,
      job_matches: [],
      sourceId: null,
      subSource: null,
      expectedSalary: 120000,
    };

    expect(buildApplicantCreatePayload(input)).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      expectedSalary: 120000,
      positionId,
      parsedData: {
        education: [],
        experience: [],
      },
    });
  });

  it('formats applicant create responses and safe log details', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');

    expect(createApplicantResponse({
      id: 'applicant-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+123',
      expectedSalary: 120000,
      parsedData: { source: 'api' },
      applicationDate: createdAt,
      createdAt,
      updatedAt: createdAt,
      recruiterId: 'recruiter-1',
    })).toEqual({
      id: 'applicant-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+123',
      expectedSalary: 120000,
      status: 'Applied',
      parsedData: { source: 'api' },
      applicationDate: '2026-01-02T03:04:05.000Z',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
      recruiterId: 'recruiter-1',
    });

    expect(asLogDetails({ field: 'value' })).toEqual({ field: 'value' });
    expect(asLogDetails(['not', 'details'])).toEqual({});
  });
});
