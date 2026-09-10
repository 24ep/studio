import { describe, expect, it } from 'vitest';

import { normalizePolicyDocument } from './policy-documents';

describe('normalizePolicyDocument', () => {
  it('preserves editor metadata and version history', () => {
    const document = normalizePolicyDocument({
      id: 'remote-work',
      title: 'Remote work',
      tags: ['hybrid', 'security'],
      externalLinks: [{ label: 'Handbook', url: 'https://example.com/handbook' }],
      versions: [{
        id: 'v1',
        createdAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'HR Admin',
        note: 'Initial version',
        title: 'Remote work',
        status: 'Published',
        content: '<p>Policy</p>',
      }],
    });

    expect(document).toMatchObject({
      id: 'remote-work',
      tags: ['hybrid', 'security'],
      externalLinks: [{ label: 'Handbook', url: 'https://example.com/handbook' }],
      versions: [{ id: 'v1', status: 'Published' }],
    });
  });

  it('rejects records without an id or title', () => {
    expect(normalizePolicyDocument({ title: 'Missing id' })).toBeNull();
    expect(normalizePolicyDocument({ id: 'missing-title' })).toBeNull();
  });
});
