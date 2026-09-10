import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanyPortalDocument } from './company-portal-builder';

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('./prisma', () => ({
  default: { position: { findMany: mocks.findMany } },
}));

vi.mock('./data-model-field-management', () => ({
  getPlatformDataModels: () => [{
    name: 'Position',
    label: 'Position',
    customFields: [],
    fields: [
      { name: 'id', label: 'ID', type: 'String', isList: false, isOptional: false },
      { name: 'title', label: 'Title', type: 'String', isList: false, isOptional: false },
      { name: 'isOpen', label: 'Is open', type: 'Boolean', isList: false, isOptional: false },
      { name: 'updatedAt', label: 'Updated at', type: 'DateTime', isList: false, isOptional: false },
      { name: 'applicants', label: 'Applicants', type: 'Applicant', isList: true, isOptional: false },
    ],
  }],
}));

import { loadCompanyPortalLiveRecords } from './company-portal-live-data';

const document: CompanyPortalDocument = {
  title: 'Jobs',
  pages: [],
  blocks: [],
  collections: [{
    id: 'positions',
    name: 'Positions',
    slug: 'positions',
    description: '',
    sourceType: 'platform',
    sourceModel: 'Position',
    activity: [],
    records: [],
    fields: [
      { id: 'title', key: 'title', name: 'Title', type: 'text', required: false },
      { id: 'open', key: 'isOpen', name: 'Is open', type: 'boolean', required: false },
      { id: 'relation', key: 'applicants', name: 'Applicants', type: 'text', required: false },
    ],
    filters: [
      { id: 'open-only', fieldKey: 'isOpen', operator: 'equals', value: 'true' },
      { id: 'title-filter', fieldKey: 'title', operator: 'contains', value: 'Engineer' },
    ],
  }],
};

describe('company portal live data', () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it('loads allowed platform records with typed filters and scalar fields only', async () => {
    mocks.findMany.mockResolvedValue([{
      id: 'position-1',
      title: 'Platform Engineer',
      isOpen: true,
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }]);

    const records = await loadCompanyPortalLiveRecords(document, ['Position']);

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { title: true, isOpen: true, id: true, updatedAt: true },
      where: {
        AND: [
          { isOpen: true },
          { title: { contains: 'Engineer', mode: 'insensitive' } },
        ],
      },
    }));
    expect(records.positions).toEqual([{
      id: 'position-1',
      values: { title: 'Platform Engineer', isOpen: 'true', applicants: '' },
      updatedAt: '2026-08-01T00:00:00.000Z',
    }]);
  });

  it('does not query a model that is not allowed for the portal', async () => {
    await expect(loadCompanyPortalLiveRecords(document, [])).resolves.toEqual({ positions: [] });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
