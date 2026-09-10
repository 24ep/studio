import { describe, expect, it } from 'vitest';

import { essRequestUpdateSchema } from './ess-contracts';

describe('essRequestUpdateSchema', () => {
  const id = '4c5f0be0-2b61-4cc2-a8b3-58aec5973975';

  it('accepts a profile revision with optimistic version', () => {
    expect(essRequestUpdateSchema.safeParse({
      id,
      requestType: 'profile_change',
      title: 'Update preferred name',
      reason: 'Correct the returned value',
      values: { preferredName: 'Ari' },
      expectedVersion: 2,
    }).success).toBe(true);
  });

  it('accepts a document request revision', () => {
    expect(essRequestUpdateSchema.safeParse({
      id,
      requestType: 'document_request',
      title: 'Request employment certificate',
      reason: 'For visa application',
      values: {
        documentType: 'employment_certificate',
        purpose: 'Visa application',
        language: 'English',
        deliveryFormat: 'digital',
        additionalDetails: 'Please include start date.',
      },
      expectedVersion: 3,
    }).success).toBe(true);
  });
});
