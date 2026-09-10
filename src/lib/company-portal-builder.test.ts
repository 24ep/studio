import { describe, expect, it } from 'vitest';

import {
  companyPortalDocumentSchema,
  createCompanyPortalBlock,
  createCompanyPortalCmsCollection,
  createDefaultCompanyPortalState,
  createDefaultJobPortalState,
  parseCompanyPortalState,
  resolveCompanyPortalBlockStyle,
  saveCompanyPortalSchema,
} from './company-portal-builder';
import {
  resolveCompanyPortalButtonAction,
  resolveCompanyPortalItemClickAction,
} from './company-portal-actions';
import { resolveCompanyPortalLinkAnchor } from './company-portal-links';
import { getCompanyPortalMetrics } from './company-portal-metrics';

describe('company portal builder', () => {
  it('creates a usable default document', () => {
    const state = createDefaultCompanyPortalState();

    expect(state.revision).toBe(0);
    expect(state.versions).toEqual([]);
    expect(state.document.pages).toEqual([]);
    expect(state.document.collections).toEqual([]);
    expect(state.document.blocks.map(block => block.type)).toEqual([
      'hero',
      'announcement',
      'quick-links',
    ]);
    expect(companyPortalDocumentSchema.safeParse(state.document).success).toBe(true);
  });

  it('creates a candidate-facing default job portal document', () => {
    const state = createDefaultJobPortalState();

    expect(state.document.title).toBe('Careers Portal Home');
    expect(state.document.pages).toEqual([]);
    expect(state.document.blocks.map(block => block.type)).toEqual([
      'hero',
      'announcement',
      'data-cards',
      'metrics',
      'quick-links',
    ]);
    expect(state.document.blocks[0]?.buttonLabel).toBe('Browse open roles');
    expect(state.document.collections).toHaveLength(2);
    expect(state.document.blocks[2]).toMatchObject({
      type: 'data-cards',
      dataCollectionId: 'portal-open-jobs-data',
      displayFieldKeys: ['title', 'team', 'location', 'workplace'],
    });
    expect(state.document.collections[1]?.records[0]?.values.applyUrl).toMatch(/^mailto:/);
    expect(state.document.blocks[3]).toMatchObject({
      type: 'metrics',
      body: '',
      dataCollectionId: 'portal-hiring-metrics-data',
      metricValueFieldKey: 'value',
      metricLabelFieldKey: 'label',
    });
    expect(getCompanyPortalMetrics(
      state.document.blocks[3],
      state.document.collections,
    )).toEqual([
      { id: 'portal-metric-open-roles', label: 'Open roles', value: '24' },
      { id: 'portal-metric-interview-teams', label: 'Interview teams', value: '6' },
      { id: 'portal-metric-hiring-locations', label: 'Hiring locations', value: '3' },
    ]);
    expect(companyPortalDocumentSchema.safeParse(state.document).success).toBe(true);
  });

  it('creates a configurable CMS collection', () => {
    expect(createCompanyPortalCmsCollection('collection-1')).toMatchObject({
      id: 'collection-1',
      name: 'New collection',
      slug: 'new-collection',
      fields: [],
      records: [],
    });
  });

  it('creates editable defaults for common component types', () => {
    expect(createCompanyPortalBlock('image', 'block-1')).toMatchObject({
      id: 'block-1',
      type: 'image',
      imageUrl: '/app_logo.png',
    });
    expect(createCompanyPortalBlock('hero', 'block-2')).toMatchObject({
      id: 'block-2',
      type: 'hero',
      buttonLabel: 'Learn more',
      buttonAction: 'internal',
      style: {
        alignment: 'left',
        background: 'default',
        heroHeight: 'standard',
      },
    });
    expect(createCompanyPortalBlock('quick-links', 'block-3').links).toEqual([{
      id: 'block-3-link-1',
      label: 'New link',
      anchor: '#section',
    }]);
    for (const type of ['data-list', 'data-table', 'data-cards'] as const) {
      expect(createCompanyPortalBlock(type, `block-${type}`)).toMatchObject({
        type,
        dataCollectionId: '',
        displayFieldKeys: [],
        maxItems: 12,
      });
    }
  });

  it('stores component-specific style options and resolves defaults for legacy blocks', () => {
    const block = createCompanyPortalBlock('data-cards', 'styled-cards');
    const parsed = companyPortalDocumentSchema.parse({
      title: 'Styled portal',
      collections: [],
      pages: [],
      blocks: [{
        ...block,
        style: {
          ...block.style,
          background: 'accent',
          columns: 4,
          cardStyle: 'elevated',
        },
      }],
    });

    expect(parsed.blocks[0].style).toMatchObject({
      background: 'accent',
      columns: 4,
      cardStyle: 'elevated',
    });
    expect(resolveCompanyPortalBlockStyle({
      ...createCompanyPortalBlock('divider', 'legacy-divider'),
      style: undefined,
    })).toMatchObject({
      contentWidth: 'wide',
      dividerStyle: 'solid',
      spacing: 'comfortable',
    });
  });

  it('supports linking a portal button to a document', () => {
    const block = {
      ...createCompanyPortalBlock('hero', 'document-link'),
      buttonAction: 'document' as const,
      buttonUrl: '/policy-documents/employee-handbook',
    };

    expect(companyPortalDocumentSchema.safeParse({
      title: 'Portal',
      blocks: [block],
      collections: [],
      pages: [],
    }).success).toBe(true);
    expect(resolveCompanyPortalButtonAction(block)).toEqual({
      href: '/policy-documents/employee-handbook',
      opensNewTab: false,
    });
  });

  it('falls back safely when persisted state is corrupt', () => {
    expect(parseCompanyPortalState({ revision: 'bad' })).toEqual(
      createDefaultCompanyPortalState(),
    );
  });

  it('loads older portal documents with an empty CMS collection list', () => {
    const parsed = parseCompanyPortalState({
      revision: 2,
      document: {
        title: 'Legacy portal',
        blocks: [],
      },
      versions: [],
    });

    expect(parsed.document.title).toBe('Legacy portal');
    expect(parsed.document.pages).toEqual([]);
    expect(parsed.document.collections).toEqual([]);
  });

  it('gives every portal page its own canvas while loading legacy pages safely', () => {
    const parsed = companyPortalDocumentSchema.parse({
      title: 'Portal home',
      blocks: [],
      pages: [{
        id: 'about-page',
        title: 'About us',
        slug: '/about',
      }],
    });

    expect(parsed.pages[0]).toMatchObject({
      id: 'about-page',
      title: 'About us',
      slug: '/about',
      blocks: [],
    });
  });

  it('migrates legacy metrics text into a data module', () => {
    const parsed = parseCompanyPortalState({
      revision: 2,
      document: {
        title: 'Legacy portal',
        blocks: [{
          id: 'legacy-metrics',
          type: 'metrics',
          title: 'At a glance',
          body: '12 Open roles|4 Hiring teams',
          buttonLabel: '',
          buttonUrl: '',
          imageUrl: '',
        }],
      },
      versions: [],
    });
    const block = parsed.document.blocks[0];

    expect(block.body).toBe('');
    expect(block.dataCollectionId).toBe('legacy-metrics-metrics-data');
    expect(getCompanyPortalMetrics(block, parsed.document.collections)).toEqual([
      {
        id: 'legacy-metrics-metric-1',
        label: 'Open roles',
        value: '12',
      },
      {
        id: 'legacy-metrics-metric-2',
        label: 'Hiring teams',
        value: '4',
      },
    ]);
  });

  it('migrates legacy quick-link text into structured links', () => {
    const parsed = parseCompanyPortalState({
      revision: 1,
      document: {
        title: 'Legacy links',
        blocks: [{
          id: 'legacy-links',
          type: 'quick-links',
          title: 'Resources',
          body: 'Open roles|Interview process',
          buttonLabel: '',
          buttonUrl: '',
          imageUrl: '',
        }],
      },
      versions: [],
    });

    expect(parsed.document.blocks[0].links).toEqual([
      {
        id: 'legacy-links-link-1',
        label: 'Open roles',
        anchor: '#open-roles',
      },
      {
        id: 'legacy-links-link-2',
        label: 'Interview process',
        anchor: '#interview-process',
      },
    ]);
  });

  it('allows safe quick-link anchors and rejects unsafe protocols', () => {
    expect(resolveCompanyPortalLinkAnchor('#open-roles')).toEqual({
      href: '#open-roles',
      opensNewTab: false,
    });
    expect(resolveCompanyPortalLinkAnchor('/jobs')).toEqual({
      href: '/jobs',
      opensNewTab: false,
    });
    expect(resolveCompanyPortalLinkAnchor('https://example.com/jobs')).toEqual({
      href: 'https://example.com/jobs',
      opensNewTab: true,
    });
    expect(resolveCompanyPortalLinkAnchor('javascript:alert(1)').href).toBe('#');
  });

  it('infers button actions when loading older portal blocks', () => {
    const legacyState = {
      revision: 2,
      document: {
        title: 'Legacy portal',
        collections: [],
        blocks: [{
          id: 'legacy-hero',
          type: 'hero',
          title: 'Welcome',
          body: '',
          buttonLabel: 'Contact us',
          buttonUrl: 'mailto:people@example.com',
          imageUrl: '',
        }],
      },
      versions: [],
    };

    expect(parseCompanyPortalState(legacyState).document.blocks[0]?.buttonAction).toBe('email');
  });

  it('keeps legacy job cards clickable when their data module has an apply URL', () => {
    const legacyState = createDefaultJobPortalState();
    const openJobs = legacyState.document.blocks.find(block => block.id === 'portal-open-jobs');
    if (!openJobs) throw new Error('Default open jobs block is missing');
    delete openJobs.itemClickAction;
    delete openJobs.itemClickFieldKey;

    const parsed = parseCompanyPortalState(legacyState, createDefaultJobPortalState());
    expect(parsed.document.blocks.find(block => block.id === 'portal-open-jobs')).toMatchObject({
      itemClickAction: 'link',
      itemClickFieldKey: 'applyUrl',
    });
  });

  it('resolves internal, external, and common button actions safely', () => {
    expect(resolveCompanyPortalButtonAction({
      buttonAction: 'internal',
      buttonUrl: 'employee-portal/policies',
    })).toEqual({
      href: '/employee-portal/policies',
      opensNewTab: false,
    });
    expect(resolveCompanyPortalButtonAction({
      buttonAction: 'external',
      buttonUrl: 'https://example.com/jobs',
    })).toEqual({
      href: 'https://example.com/jobs',
      opensNewTab: true,
    });
    expect(resolveCompanyPortalButtonAction({
      buttonAction: 'email',
      buttonUrl: 'people@example.com',
    }).href).toBe('mailto:people@example.com');
    expect(resolveCompanyPortalButtonAction({
      buttonAction: 'phone',
      buttonUrl: '+66 (0) 2123-4567',
    }).href).toBe('tel:+66021234567');
    expect(resolveCompanyPortalButtonAction({
      buttonAction: 'section',
      buttonUrl: 'resources',
    }).href).toBe('#resources');
  });

  it('resolves configurable record click actions and rejects unsafe field values', () => {
    const block = {
      ...createCompanyPortalBlock('data-cards', 'clickable-cards'),
      itemClickAction: 'link' as const,
      itemClickFieldKey: 'detailsUrl',
    };

    expect(resolveCompanyPortalItemClickAction(block, {
      values: { detailsUrl: 'https://example.com/jobs/42' },
    })).toEqual({
      href: 'https://example.com/jobs/42',
      opensNewTab: true,
    });
    expect(resolveCompanyPortalItemClickAction(block, {
      values: { detailsUrl: 'javascript:alert(1)' },
    })).toBeNull();
    expect(resolveCompanyPortalItemClickAction({
      ...block,
      itemClickAction: 'email',
    }, {
      values: { detailsUrl: 'people@example.com' },
    })?.href).toBe('mailto:people@example.com');
  });

  it('validates optimistic revision data when saving', () => {
    const document = createDefaultCompanyPortalState().document;

    expect(saveCompanyPortalSchema.safeParse({
      document,
      expectedRevision: 4,
      note: 'Updated employee links',
    }).success).toBe(true);
    expect(saveCompanyPortalSchema.safeParse({
      document,
      expectedRevision: -1,
    }).success).toBe(false);
  });
});
