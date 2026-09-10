import { describe, expect, it } from 'vitest';

import {
  getUpdatedApplicantFieldNames,
  shapeUnchangedApplicant,
  shapeUpdatedApplicant,
} from './applicant-v1-detail-update-response';

describe('applicant-v1-detail-update-response', () => {
  it('shapes updated applicants with custom attributes and source data', () => {
    expect(shapeUpdatedApplicant({
      id: 'applicant-1',
      customAttributes: { level: 'senior' },
      sourceId: 'source-1',
      sourceName: 'Referral',
      sourceDescription: 'Employee referral',
      sourceEmail: 'referrals@example.test',
      sourceLogo: '/source.png',
    })).toMatchObject({
      id: 'applicant-1',
      custom_attributes: { level: 'senior' },
      source: {
        id: 'source-1',
        name: 'Referral',
        description: 'Employee referral',
        email: 'referrals@example.test',
        logo: '/source.png',
      },
    });

    expect(shapeUpdatedApplicant({ id: 'applicant-2' })).toMatchObject({
      custom_attributes: {},
      source: null,
    });
  });

  it('shapes unchanged applicants and lists defined update fields', () => {
    expect(shapeUnchangedApplicant({
      id: 'applicant-1',
      customAttributes: null,
    })).toMatchObject({
      id: 'applicant-1',
      custom_attributes: {},
    });

    expect(getUpdatedApplicantFieldNames({
      name: 'Ada',
      email: undefined,
      status: 'screening',
    })).toEqual(['name', 'status']);
  });
});
