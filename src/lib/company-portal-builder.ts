import { z } from 'zod';

export const companyPortalBlockTypeSchema = z.enum([
  'hero',
  'announcement',
  'rich-text',
  'quick-links',
  'image',
  'metrics',
  'data-list',
  'data-table',
  'data-cards',
  'divider',
]);

export const companyPortalButtonActionSchema = z.enum([
  'internal',
  'document',
  'external',
  'section',
  'email',
  'phone',
]);

export const companyPortalItemClickActionSchema = z.enum([
  'none',
  'link',
  ...companyPortalButtonActionSchema.options,
]);

export const companyPortalQuickLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(80).default(''),
  anchor: z.string().max(500).default(''),
});

export const companyPortalBlockStyleSchema = z.object({
  alignment: z.enum(['left', 'center']).optional(),
  background: z.enum(['default', 'muted', 'accent']).optional(),
  spacing: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  contentWidth: z.enum(['narrow', 'standard', 'wide']).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  cardStyle: z.enum(['outline', 'soft', 'elevated']).optional(),
  imageLayout: z.enum(['left', 'right', 'full']).optional(),
  imageFit: z.enum(['cover', 'contain']).optional(),
  dividerStyle: z.enum(['solid', 'dashed']).optional(),
  heroHeight: z.enum(['compact', 'standard', 'tall']).optional(),
});

function inferButtonAction(value: string) {
  if (/^https?:\/\//i.test(value)) return 'external' as const;
  if (/^mailto:/i.test(value)) return 'email' as const;
  if (/^tel:/i.test(value)) return 'phone' as const;
  if (value.startsWith('#')) return 'section' as const;
  return 'internal' as const;
}

export const companyPortalBlockSchema = z.object({
  id: z.string().min(1),
  type: companyPortalBlockTypeSchema,
  title: z.string().max(160).default(''),
  body: z.string().max(4000).default(''),
  buttonLabel: z.string().max(80).default(''),
  buttonUrl: z.string().max(500).default(''),
  buttonAction: companyPortalButtonActionSchema.optional(),
  itemClickAction: companyPortalItemClickActionSchema.optional(),
  itemClickFieldKey: z.string().max(120).optional(),
  imageUrl: z.string().max(1000).default(''),
  dataCollectionId: z.string().max(120).default(''),
  metricValueFieldKey: z.string().max(80).default(''),
  metricLabelFieldKey: z.string().max(80).default(''),
  displayFieldKeys: z.array(z.string().max(120)).max(12).default([]),
  maxItems: z.number().int().min(1).max(100).default(12),
  links: z.array(companyPortalQuickLinkSchema).max(12).optional(),
  style: companyPortalBlockStyleSchema.optional(),
}).transform(block => ({
  ...block,
  body: block.type === 'quick-links' ? '' : block.body,
  buttonAction: block.buttonAction ?? inferButtonAction(block.buttonUrl),
  links: block.links ?? (
    block.type === 'quick-links'
      ? block.body
        .split('|')
        .map(item => item.trim())
        .filter(Boolean)
        .map((label, index) => ({
          id: `${block.id}-link-${index + 1}`,
          label,
          anchor: `#${label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `link-${index + 1}`}`,
        }))
      : []
  ),
}));

export const companyPortalCmsFieldTypeSchema = z.enum([
  'text',
  'rich-text',
  'number',
  'date',
  'boolean',
  'asset',
]);

export const companyPortalCmsFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  key: z.string().min(1).max(80),
  type: companyPortalCmsFieldTypeSchema,
  required: z.boolean().default(false),
});

export const companyPortalDataFilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'is_empty',
  'is_not_empty',
  'greater_than',
  'less_than',
]);

export const companyPortalDataFilterSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1).max(120),
  operator: companyPortalDataFilterOperatorSchema.default('equals'),
  value: z.string().max(500).default(''),
});

export const companyPortalCmsRecordSchema = z.object({
  id: z.string().min(1),
  values: z.record(z.string(), z.string()),
  updatedAt: z.string(),
});

export const companyPortalCmsActivitySchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1).max(240),
  createdAt: z.string(),
});

export const companyPortalCmsCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  fields: z.array(companyPortalCmsFieldSchema).max(50).default([]),
  records: z.array(companyPortalCmsRecordSchema).max(500).default([]),
  activity: z.array(companyPortalCmsActivitySchema).max(100).default([]),
  sourceType: z.enum(['custom', 'platform']).default('custom'),
  sourceModel: z.string().max(120).default(''),
  filters: z.array(companyPortalDataFilterSchema).max(20).default([]),
});

export const companyPortalPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  blocks: z.array(companyPortalBlockSchema).max(60).default([]),
});

export const companyPortalDocumentSchema = z.object({
  title: z.string().min(1).max(120),
  blocks: z.array(companyPortalBlockSchema).max(60),
  collections: z.array(companyPortalCmsCollectionSchema).max(30).default([]),
  pages: z.array(companyPortalPageSchema).max(50).default([]),
});

export const companyPortalVersionSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().nonnegative(),
  createdAt: z.string(),
  createdBy: z.string(),
  note: z.string().max(240),
  document: companyPortalDocumentSchema,
});

export const companyPortalStateSchema = z.object({
  revision: z.number().int().nonnegative(),
  document: companyPortalDocumentSchema,
  versions: z.array(companyPortalVersionSchema).max(25),
});

export const saveCompanyPortalSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  note: z.string().trim().max(240).default('Portal content updated'),
  document: companyPortalDocumentSchema,
});

export const restoreCompanyPortalSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  versionId: z.string().min(1),
});

export type CompanyPortalBlockType = z.infer<typeof companyPortalBlockTypeSchema>;
export type CompanyPortalButtonAction = z.infer<typeof companyPortalButtonActionSchema>;
export type CompanyPortalItemClickAction = z.infer<typeof companyPortalItemClickActionSchema>;
export type CompanyPortalQuickLink = z.infer<typeof companyPortalQuickLinkSchema>;
export type CompanyPortalBlockStyle = z.infer<typeof companyPortalBlockStyleSchema>;
export type CompanyPortalBlock = z.infer<typeof companyPortalBlockSchema>;
export type CompanyPortalCmsFieldType = z.infer<typeof companyPortalCmsFieldTypeSchema>;
export type CompanyPortalCmsField = z.infer<typeof companyPortalCmsFieldSchema>;
export type CompanyPortalCmsRecord = z.infer<typeof companyPortalCmsRecordSchema>;
export type CompanyPortalLiveRecords = Record<string, CompanyPortalCmsRecord[]>;
export type CompanyPortalCmsActivity = z.infer<typeof companyPortalCmsActivitySchema>;
export type CompanyPortalDataFilterOperator = z.infer<typeof companyPortalDataFilterOperatorSchema>;
export type CompanyPortalDataFilter = z.infer<typeof companyPortalDataFilterSchema>;
export type CompanyPortalCmsCollection = z.infer<typeof companyPortalCmsCollectionSchema>;
export type CompanyPortalPage = z.infer<typeof companyPortalPageSchema>;
export type CompanyPortalDocument = z.infer<typeof companyPortalDocumentSchema>;
export type CompanyPortalVersion = z.infer<typeof companyPortalVersionSchema>;
export type CompanyPortalState = z.infer<typeof companyPortalStateSchema>;

export const DEFAULT_EMPLOYEE_PORTAL_DOCUMENT: CompanyPortalDocument = {
  title: 'Employee Portal Home',
  collections: [],
  pages: [],
  blocks: [
    {
      id: 'portal-hero',
      type: 'hero',
      title: 'Everything you need for work, in one place',
      body: 'Find company updates, policies, benefits, and resources for every stage of your employee journey.',
      buttonLabel: 'Explore resources',
      buttonUrl: '#resources',
      buttonAction: 'section',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [],
    },
    {
      id: 'portal-announcement',
      type: 'announcement',
      title: 'Company update',
      body: 'The latest people news and operational announcements will appear here.',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [],
    },
    {
      id: 'portal-links',
      type: 'quick-links',
      title: 'Popular resources',
      body: '',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [
        {
          id: 'employee-handbook-link',
          label: 'Employee handbook',
          anchor: '#employee-handbook',
        },
        {
          id: 'benefits-hub-link',
          label: 'Benefits hub',
          anchor: '#benefits-hub',
        },
        {
          id: 'leave-attendance-link',
          label: 'Leave and attendance',
          anchor: '#leave-and-attendance',
        },
        {
          id: 'learning-center-link',
          label: 'Learning center',
          anchor: '#learning-center',
        },
      ],
    },
  ],
};

export const DEFAULT_JOB_PORTAL_DOCUMENT: CompanyPortalDocument = {
  title: 'Careers Portal Home',
  pages: [],
  collections: [{
    id: 'portal-hiring-metrics-data',
    name: 'Hiring metrics',
    slug: 'hiring-metrics',
    description: 'Data module used by the careers portal metrics block.',
    fields: [
      {
        id: 'portal-metric-label-field',
        name: 'Label',
        key: 'label',
        type: 'text',
        required: true,
      },
      {
        id: 'portal-metric-value-field',
        name: 'Value',
        key: 'value',
        type: 'number',
        required: true,
      },
    ],
    records: [
      {
        id: 'portal-metric-open-roles',
        values: { label: 'Open roles', value: '24' },
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'portal-metric-interview-teams',
        values: { label: 'Interview teams', value: '6' },
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'portal-metric-hiring-locations',
        values: { label: 'Hiring locations', value: '3' },
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    activity: [{
      id: 'portal-hiring-metrics-created',
      action: 'Default hiring metrics data module created',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    sourceType: 'custom',
    sourceModel: '',
    filters: [],
  }, {
    id: 'portal-open-jobs-data',
    name: 'Open jobs',
    slug: 'open-jobs',
    description: 'Published job openings. Set Apply URL to any application form or applicant tracking website.',
    fields: [
      { id: 'job-title-field', name: 'Job title', key: 'title', type: 'text', required: true },
      { id: 'job-team-field', name: 'Team', key: 'team', type: 'text', required: true },
      { id: 'job-location-field', name: 'Location', key: 'location', type: 'text', required: true },
      { id: 'job-workplace-field', name: 'Workplace', key: 'workplace', type: 'text', required: false },
      { id: 'job-apply-url-field', name: 'Apply URL', key: 'applyUrl', type: 'text', required: true },
    ],
    records: [
      { id: 'job-product-designer', values: { title: 'Product Designer', team: 'Product', location: 'Bangkok, Thailand', workplace: 'Hybrid', applyUrl: 'mailto:careers@example.com?subject=Application%20-%20Product%20Designer' }, updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'job-people-partner', values: { title: 'People Partner', team: 'People', location: 'Bangkok, Thailand', workplace: 'Hybrid', applyUrl: 'mailto:careers@example.com?subject=Application%20-%20People%20Partner' }, updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'job-operations-lead', values: { title: 'Operations Lead', team: 'Operations', location: 'Remote', workplace: 'Remote', applyUrl: 'mailto:careers@example.com?subject=Application%20-%20Operations%20Lead' }, updatedAt: '2026-01-01T00:00:00.000Z' },
    ],
    activity: [{ id: 'portal-open-jobs-created', action: 'Default open jobs collection created', createdAt: '2026-01-01T00:00:00.000Z' }],
    sourceType: 'custom',
    sourceModel: '',
    filters: [],
  }],
  blocks: [
    {
      id: 'portal-hero',
      type: 'hero',
      title: 'Find the role where your work moves faster',
      body: 'Explore open jobs, hiring steps, team stories, and what candidates can expect from the first conversation through offer.',
      buttonLabel: 'Browse open roles',
      buttonUrl: '#open-roles',
      buttonAction: 'section',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [],
    },
    {
      id: 'portal-announcement',
      type: 'announcement',
      title: 'Now hiring across priority teams',
      body: 'Recruiters review new applications daily for product, operations, engineering, and growth roles.',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [],
    },
    {
      id: 'portal-open-jobs',
      type: 'data-cards',
      title: 'Open positions',
      body: '',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      itemClickAction: 'link',
      itemClickFieldKey: 'applyUrl',
      imageUrl: '',
      dataCollectionId: 'portal-open-jobs-data',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: ['title', 'team', 'location', 'workplace'],
      maxItems: 24,
      links: [],
    },
    {
      id: 'portal-metrics',
      type: 'metrics',
      title: 'Hiring at a glance',
      body: '',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      imageUrl: '',
      dataCollectionId: 'portal-hiring-metrics-data',
      metricValueFieldKey: 'value',
      metricLabelFieldKey: 'label',
      displayFieldKeys: [],
      maxItems: 12,
      links: [],
    },
    {
      id: 'portal-links',
      type: 'quick-links',
      title: 'Candidate resources',
      body: '',
      buttonLabel: '',
      buttonUrl: '',
      buttonAction: 'internal',
      imageUrl: '',
      dataCollectionId: '',
      metricValueFieldKey: '',
      metricLabelFieldKey: '',
      displayFieldKeys: [],
      maxItems: 12,
      links: [
        {
          id: 'open-roles-link',
          label: 'Open roles',
          anchor: '#open-roles',
        },
        {
          id: 'interview-process-link',
          label: 'Interview process',
          anchor: '#interview-process',
        },
        {
          id: 'life-at-company-link',
          label: 'Life at our company',
          anchor: '#life-at-company',
        },
        {
          id: 'application-support-link',
          label: 'Application support',
          anchor: '#application-support',
        },
      ],
    },
  ],
};

export const DEFAULT_COMPANY_PORTAL_DOCUMENT = DEFAULT_EMPLOYEE_PORTAL_DOCUMENT;

export function createCompanyPortalCmsCollection(
  id: string,
): CompanyPortalCmsCollection {
  const now = new Date().toISOString();
  return {
    id,
    name: 'New collection',
    slug: 'new-collection',
    description: '',
    fields: [],
    records: [],
    activity: [{
      id: `${id}-created`,
      action: 'Data module draft created',
      createdAt: now,
    }],
    sourceType: 'custom',
    sourceModel: '',
    filters: [],
  };
}

export function createDefaultCompanyPortalState(): CompanyPortalState {
  return {
    revision: 0,
    document: structuredClone(DEFAULT_COMPANY_PORTAL_DOCUMENT),
    versions: [],
  };
}

export function createDefaultJobPortalState(): CompanyPortalState {
  return {
    revision: 0,
    document: structuredClone(DEFAULT_JOB_PORTAL_DOCUMENT),
    versions: [],
  };
}

export function parseCompanyPortalState(
  value: unknown,
  fallbackState: CompanyPortalState = createDefaultCompanyPortalState(),
): CompanyPortalState {
  const parsed = companyPortalStateSchema.safeParse(value);
  if (!parsed.success) return fallbackState;

  return {
    ...parsed.data,
    document: migrateLegacyDataCardActions(migrateLegacyMetricData(parsed.data.document)),
    versions: parsed.data.versions.map(version => ({
      ...version,
      document: migrateLegacyDataCardActions(migrateLegacyMetricData(version.document)),
    })),
  };
}

function migrateLegacyDataCardActions(
  document: CompanyPortalDocument,
): CompanyPortalDocument {
  const migrateBlocks = (blocks: CompanyPortalBlock[]) => blocks.map(block => {
    if (block.type !== 'data-cards' || block.itemClickAction !== undefined) return block;
    const collection = document.collections.find(item => item.id === block.dataCollectionId);
    if (!collection?.fields.some(field => field.key === 'applyUrl')) return block;
    return { ...block, itemClickAction: 'link' as const, itemClickFieldKey: 'applyUrl' };
  });

  return {
    ...document,
    blocks: migrateBlocks(document.blocks),
    pages: document.pages.map(page => ({ ...page, blocks: migrateBlocks(page.blocks) })),
  };
}

function migrateLegacyMetricData(
  document: CompanyPortalDocument,
): CompanyPortalDocument {
  const collections = [...document.collections];
  let changed = false;

  const blocks = document.blocks.map(block => {
    if (block.type !== 'metrics' || block.dataCollectionId || !block.body.trim()) {
      return block;
    }

    const metrics = block.body
      .split('|')
      .map(item => item.trim())
      .filter(Boolean)
      .map((item, index) => {
        const [value, ...labelParts] = item.split(/\s+/);
        return {
          id: `${block.id}-metric-${index + 1}`,
          values: {
            label: labelParts.join(' ') || `Metric ${index + 1}`,
            value,
          },
          updatedAt: '1970-01-01T00:00:00.000Z',
        };
      });

    if (metrics.length === 0) return block;

    const collectionBaseId = `${block.id}-metrics-data`.slice(0, 110);
    let collectionId = collectionBaseId;
    let suffix = 2;
    while (collections.some(collection => collection.id === collectionId)) {
      collectionId = `${collectionBaseId}-${suffix}`;
      suffix += 1;
    }

    const slug = `${block.id}-metrics-data`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 120) || 'metrics-data';

    collections.push({
      id: collectionId,
      name: `${block.title || 'Metrics'} data`.slice(0, 120),
      slug,
      description: 'Data module migrated from the legacy metrics text field.',
      fields: [
        {
          id: `${collectionId}-label`,
          name: 'Label',
          key: 'label',
          type: 'text',
          required: true,
        },
        {
          id: `${collectionId}-value`,
          name: 'Value',
          key: 'value',
          type: 'number',
          required: true,
        },
      ],
      records: metrics,
      activity: [{
        id: `${collectionId}-migrated`,
        action: 'Legacy metrics converted to a data module',
        createdAt: '1970-01-01T00:00:00.000Z',
      }],
      sourceType: 'custom',
      sourceModel: '',
      filters: [],
    });
    changed = true;

    return {
      ...block,
      body: '',
      dataCollectionId: collectionId,
      metricValueFieldKey: 'value',
      metricLabelFieldKey: 'label',
    };
  });

  return changed ? { ...document, blocks, collections } : document;
}

export function createCompanyPortalBlock(
  type: CompanyPortalBlockType,
  id: string,
): CompanyPortalBlock {
  const defaults: Record<CompanyPortalBlockType, Pick<CompanyPortalBlock, 'title' | 'body'>> = {
    hero: {
      title: 'A clear headline for candidates',
      body: 'Add a short supporting message that helps candidates understand the role, team, or next step.',
    },
    announcement: {
      title: 'Hiring update',
      body: 'Share a timely hiring update with candidates.',
    },
    'rich-text': {
      title: 'Section heading',
      body: 'Add the information candidates need in this section.',
    },
    'quick-links': {
      title: 'Quick links',
      body: '',
    },
    image: {
      title: 'Image caption',
      body: 'Optional supporting description.',
    },
    metrics: {
      title: 'At a glance',
      body: '',
    },
    'data-list': {
      title: 'Latest opportunities',
      body: '',
    },
    'data-table': {
      title: 'Open positions',
      body: '',
    },
    'data-cards': {
      title: 'Explore opportunities',
      body: '',
    },
    divider: {
      title: '',
      body: '',
    },
  };

  return {
    id,
    type,
    ...defaults[type],
    buttonLabel: type === 'hero' ? 'Learn more' : '',
    buttonUrl: '',
    buttonAction: 'internal',
    itemClickAction: 'none',
    itemClickFieldKey: '',
    imageUrl: type === 'image' ? '/app_logo.png' : '',
    dataCollectionId: '',
    metricValueFieldKey: '',
    metricLabelFieldKey: '',
    displayFieldKeys: [],
    maxItems: 12,
    style: getDefaultCompanyPortalBlockStyle(type),
    links: type === 'quick-links'
      ? [{
        id: `${id}-link-1`,
        label: 'New link',
        anchor: '#section',
      }]
      : [],
  };
}

export function getDefaultCompanyPortalBlockStyle(type: CompanyPortalBlockType): CompanyPortalBlockStyle {
  const defaults: Record<CompanyPortalBlockType, CompanyPortalBlockStyle> = {
    hero: { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'wide', heroHeight: 'standard' },
    announcement: { alignment: 'left', background: 'default', spacing: 'compact', contentWidth: 'wide' },
    'rich-text': { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'narrow' },
    'quick-links': { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'wide', columns: 4, cardStyle: 'outline' },
    image: { alignment: 'left', background: 'default', spacing: 'comfortable', contentWidth: 'wide', imageLayout: 'left', imageFit: 'cover' },
    metrics: { alignment: 'left', background: 'default', spacing: 'comfortable', contentWidth: 'wide', columns: 3, cardStyle: 'soft' },
    'data-list': { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'wide' },
    'data-table': { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'wide', cardStyle: 'outline' },
    'data-cards': { alignment: 'left', background: 'default', spacing: 'spacious', contentWidth: 'wide', columns: 3, cardStyle: 'soft' },
    divider: { background: 'default', spacing: 'comfortable', contentWidth: 'wide', dividerStyle: 'solid' },
  };
  return defaults[type];
}

export function resolveCompanyPortalBlockStyle(
  block: Pick<CompanyPortalBlock, 'style' | 'type'>,
): CompanyPortalBlockStyle {
  return { ...getDefaultCompanyPortalBlockStyle(block.type), ...block.style };
}
