import { z } from 'zod';

import type { PlatformModuleId } from '@/lib/types';

export const hrisResourceNames = [
  'assignments',
  'employment-events',
  'exits',
  'cases',
  'assets',
  'asset-assignments',
  'compensation-reviews',
  'succession-plans',
  'talent-reviews',
  'internal-opportunities',
  'workforce-plans',
  'retention-policies',
  'privacy-requests',
  'integration-mappings',
  'feature-flags',
] as const;

export type HrisResourceName = (typeof hrisResourceNames)[number];

const jsonCreateColumns = new Set([
  'proposed_values', 'checklist', 'metadata', 'guidelines', 'configuration',
  'eligibility_rules', 'assumptions', 'demand', 'supply', 'cost_forecast', 'scope',
  'exit_interview', 'evidence', 'actions',
]);

const createColumnCasts: Partial<Record<HrisResourceName, Record<string, string>>> = {
  exits: {
    employee_id: 'uuid',
    company_id: 'uuid',
    notice_date: 'date',
    last_working_date: 'date',
    document_retention_until: 'date',
  },
};

export function castCreatePlaceholder(resource: HrisResourceName, column: string, placeholder: string) {
  if (jsonCreateColumns.has(column)) return `${placeholder}::jsonb`;
  const cast = createColumnCasts[resource]?.[column];
  return cast ? `${placeholder}::${cast}` : placeholder;
}

type ResourceConfig = {
  table: string;
  companyScoped: boolean;
  sensitive?: boolean;
  viewPermissions: PlatformModuleId[];
  managePermissions: PlatformModuleId[];
  createSchema: z.ZodType<Record<string, unknown>>;
};

const uuid = z.string().uuid();
const optionalUuid = uuid.nullish();
const date = z.string().date();
const optionalDate = date.nullish();

const lifecycleBase = {
  companyId: optionalUuid,
  employeeId: uuid,
  reason: z.string().trim().min(2).max(4000),
};

export const hrisResourceConfig: Record<HrisResourceName, ResourceConfig> = {
  assignments: {
    table: 'hr_employment_assignments',
    companyScoped: true,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      employeeId: uuid,
      companyId: optionalUuid,
      clientId: optionalUuid,
      positionId: optionalUuid,
      departmentId: optionalUuid,
      managerId: optionalUuid,
      gradeId: optionalUuid,
      workScheduleId: optionalUuid,
      assignmentType: z.enum(['primary', 'secondary', 'temporary', 'secondment']).default('primary'),
      employmentType: z.string().trim().min(1).max(80).default('full_time'),
      jobTitle: z.string().trim().max(240).nullish(),
      location: z.string().trim().max(240).nullish(),
      contractNumber: z.string().trim().max(120).nullish(),
      effectiveFrom: date,
      effectiveTo: optionalDate,
      reason: z.string().trim().min(2).max(2000),
    }).superRefine((value, context) => {
      if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
        context.addIssue({
          code: 'custom',
          path: ['effectiveTo'],
          message: 'Effective-to date must be on or after effective-from date.',
        });
      }
    }),
  },
  'employment-events': {
    table: 'hr_employment_events',
    companyScoped: true,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      ...lifecycleBase,
      eventType: z.enum(['hire', 'transfer', 'promotion', 'demotion', 'manager_change', 'location_change', 'contract_change', 'probation_decision', 'correction']),
      effectiveDate: date,
      proposedValues: z.record(z.string(), z.unknown()),
      requestId: z.string().trim().max(160).nullish(),
      idempotencyKey: z.string().trim().min(8).max(200),
    }),
  },
  exits: {
    table: 'hr_exit_cases',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      employeeId: uuid,
      companyId: optionalUuid,
      exitType: z.enum(['resignation', 'termination', 'retirement', 'abandonment', 'contract_end']),
      noticeDate: optionalDate,
      lastWorkingDate: date,
      reason: z.string().trim().min(2).max(4000),
      rehireEligible: z.boolean().nullish(),
      documentRetentionUntil: optionalDate,
      checklist: z.array(z.record(z.string(), z.unknown())).default([]),
    }).superRefine((value, context) => {
      if (value.noticeDate && value.noticeDate > value.lastWorkingDate) {
        context.addIssue({
          code: 'custom',
          path: ['noticeDate'],
          message: 'Notice date cannot be after the last working date.',
        });
      }
    }),
  },
  cases: {
    table: 'hr_cases',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      employeeId: optionalUuid,
      caseNumber: z.string().trim().min(2).max(80),
      caseType: z.enum(['grievance', 'disciplinary', 'investigation', 'complaint', 'corrective_action', 'other']),
      confidentiality: z.enum(['restricted', 'strictly_confidential']).default('restricted'),
      title: z.string().trim().min(2).max(240),
      description: z.string().trim().min(2).max(20000),
      priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
      ownerUserId: optionalUuid,
      dueAt: z.string().datetime().nullish(),
    }),
  },
  assets: {
    table: 'hr_assets',
    companyScoped: true,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      assetTag: z.string().trim().min(1).max(100),
      assetType: z.string().trim().min(1).max(100),
      name: z.string().trim().min(1).max(240),
      serialNumber: z.string().trim().max(200).nullish(),
      purchaseDate: optionalDate,
      value: z.number().min(0).nullish(),
      currency: z.string().trim().length(3).default('THB'),
      metadata: z.record(z.string(), z.unknown()).default({}),
    }),
  },
  'asset-assignments': {
    table: 'hr_asset_assignments',
    companyScoped: false,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      assetId: uuid,
      employeeId: uuid,
      expectedReturnAt: z.string().datetime().nullish(),
      notes: z.string().trim().max(2000).nullish(),
    }),
  },
  'compensation-reviews': {
    table: 'hr_compensation_review_cycles',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PAYROLL_VIEW', 'HR_PAYROLL_MANAGE'],
    managePermissions: ['HR_PAYROLL_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      name: z.string().trim().min(2).max(200),
      effectiveDate: date,
      budgetAmount: z.number().min(0),
      currency: z.string().trim().length(3).default('THB'),
      guidelines: z.record(z.string(), z.unknown()).default({}),
    }),
  },
  'succession-plans': {
    table: 'hr_succession_plans',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'],
    managePermissions: ['HR_WORKFORCE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      positionId: optionalUuid,
      incumbentEmployeeId: optionalUuid,
      criticality: z.enum(['normal', 'important', 'critical']).default('normal'),
      riskLevel: z.enum(['low', 'medium', 'high']).nullish(),
      notes: z.string().trim().max(4000).nullish(),
    }),
  },
  'talent-reviews': {
    table: 'hr_talent_reviews',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_WORKFORCE_MANAGE'],
    managePermissions: ['HR_WORKFORCE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      name: z.string().trim().min(2).max(200),
      reviewDate: date,
      configuration: z.record(z.string(), z.unknown()).default({}),
    }),
  },
  'internal-opportunities': {
    table: 'hr_internal_opportunities',
    companyScoped: true,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      positionId: optionalUuid,
      title: z.string().trim().min(2).max(240),
      description: z.string().trim().max(10000).nullish(),
      eligibilityRules: z.record(z.string(), z.unknown()).default({}),
      opensAt: z.string().datetime().nullish(),
      closesAt: z.string().datetime().nullish(),
    }),
  },
  'workforce-plans': {
    table: 'hr_workforce_plans',
    companyScoped: true,
    viewPermissions: ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE'],
    managePermissions: ['HR_WORKFORCE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      name: z.string().trim().min(2).max(240),
      planningPeriodStart: date,
      planningPeriodEnd: date,
      scenario: z.string().trim().min(1).max(100).default('baseline'),
      assumptions: z.record(z.string(), z.unknown()).default({}),
      demand: z.array(z.record(z.string(), z.unknown())).default([]),
      supply: z.array(z.record(z.string(), z.unknown())).default([]),
      costForecast: z.record(z.string(), z.unknown()).default({}),
    }).superRefine((value, context) => {
      if (value.planningPeriodEnd < value.planningPeriodStart) {
        context.addIssue({
          code: 'custom',
          path: ['planningPeriodEnd'],
          message: 'Planning period end must be on or after its start.',
        });
      }
    }),
  },
  'retention-policies': {
    table: 'hr_retention_policies',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      recordType: z.string().trim().min(2).max(120),
      retentionDays: z.number().int().min(1).max(36500),
      legalBasis: z.string().trim().min(2).max(1000),
      action: z.enum(['review', 'archive', 'anonymize', 'delete']).default('review'),
      isActive: z.boolean().default(true),
    }),
  },
  'privacy-requests': {
    table: 'hr_privacy_requests',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      employeeId: optionalUuid,
      requestType: z.enum(['access', 'correction', 'export', 'restriction', 'deletion']),
      dueAt: z.string().datetime(),
      scope: z.record(z.string(), z.unknown()).default({}),
    }),
  },
  'integration-mappings': {
    table: 'hr_integration_mappings',
    companyScoped: true,
    sensitive: true,
    viewPermissions: ['HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      integrationType: z.enum(['identity', 'banking', 'accounting', 'benefits', 'time', 'payroll']),
      provider: z.string().trim().min(1).max(120),
      externalKey: z.string().trim().min(1).max(240),
      internalResource: z.string().trim().min(1).max(120),
      internalId: optionalUuid,
      configuration: z.record(z.string(), z.unknown()).default({}),
    }),
  },
  'feature-flags': {
    table: 'hr_feature_flags',
    companyScoped: true,
    viewPermissions: ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'],
    managePermissions: ['HR_PEOPLE_MANAGE'],
    createSchema: z.object({
      companyId: optionalUuid,
      featureKey: z.string().trim().min(2).max(160),
      enabled: z.boolean().default(false),
      configuration: z.record(z.string(), z.unknown()).default({}),
    }),
  },
};

export const listQuerySchema = z.object({
  companyId: optionalUuid,
  employeeId: optionalUuid,
  status: z.string().trim().max(80).nullish(),
  asOf: optionalDate,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const updateEnvelopeSchema = z.object({
  expectedVersion: z.number().int().min(1),
  status: z.string().trim().min(1).max(80).optional(),
  reason: z.string().trim().min(2).max(4000),
  changes: z.record(z.string(), z.unknown()).default({}),
});

const updateSchemas = {
  assignments: z.object({
    clientId: optionalUuid, positionId: optionalUuid, departmentId: optionalUuid, managerId: optionalUuid,
    gradeId: optionalUuid, workScheduleId: optionalUuid,
    assignmentType: z.enum(['primary', 'secondary', 'temporary', 'secondment']),
    employmentType: z.string().trim().min(1).max(80), jobTitle: z.string().trim().max(240).nullish(),
    location: z.string().trim().max(240).nullish(), contractNumber: z.string().trim().max(120).nullish(),
    effectiveFrom: date, effectiveTo: optionalDate, reason: z.string().trim().min(2).max(2000),
  }).partial().strict(),
  'employment-events': z.object({
    eventType: z.enum(['hire', 'transfer', 'promotion', 'demotion', 'manager_change', 'location_change', 'contract_change', 'probation_decision', 'correction']),
    effectiveDate: date, proposedValues: z.record(z.string(), z.unknown()), requestId: z.string().trim().max(160).nullish(),
    reason: z.string().trim().min(2).max(4000),
  }).partial().strict(),
  exits: z.object({
    exitType: z.enum(['resignation', 'termination', 'retirement', 'abandonment', 'contract_end']),
    noticeDate: optionalDate, lastWorkingDate: date, reason: z.string().trim().min(2).max(4000),
    rehireEligible: z.boolean().nullish(), rehireNotes: z.string().trim().max(4000).nullish(),
    exitInterview: z.record(z.string(), z.unknown()),
    leaveSettlementStatus: z.enum(['pending', 'in_progress', 'completed', 'not_required']),
    finalPayrollStatus: z.enum(['pending', 'in_progress', 'completed', 'not_required']),
    accessRevocationStatus: z.enum(['pending', 'in_progress', 'completed', 'not_required']),
    ownershipTransferStatus: z.enum(['pending', 'in_progress', 'completed', 'not_required']),
    documentRetentionUntil: optionalDate, checklist: z.array(z.record(z.string(), z.unknown())),
    completedAt: z.string().datetime().nullish(),
  }).partial().strict(),
  cases: z.object({
    caseType: z.enum(['grievance', 'disciplinary', 'investigation', 'complaint', 'corrective_action', 'other']),
    confidentiality: z.enum(['restricted', 'strictly_confidential']), title: z.string().trim().min(2).max(240),
    description: z.string().trim().min(2).max(20000), priority: z.enum(['low', 'normal', 'high', 'critical']),
    ownerUserId: optionalUuid, dueAt: z.string().datetime().nullish(), evidence: z.array(z.unknown()),
    actions: z.array(z.unknown()), outcome: z.string().trim().max(10000).nullish(),
    appealStatus: z.string().trim().max(80).nullish(), closedAt: z.string().datetime().nullish(),
  }).partial().strict(),
  assets: z.object({
    assetTag: z.string().trim().min(1).max(100), assetType: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(240), serialNumber: z.string().trim().max(200).nullish(),
    purchaseDate: optionalDate, value: z.number().min(0).nullish(), currency: z.string().trim().length(3),
    metadata: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'asset-assignments': z.object({
    expectedReturnAt: z.string().datetime().nullish(), acknowledgedAt: z.string().datetime().nullish(),
    returnedAt: z.string().datetime().nullish(), returnCondition: z.string().trim().max(500).nullish(),
    notes: z.string().trim().max(2000).nullish(),
  }).partial().strict(),
  'compensation-reviews': z.object({
    name: z.string().trim().min(2).max(200), effectiveDate: date, budgetAmount: z.number().min(0),
    currency: z.string().trim().length(3), guidelines: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'succession-plans': z.object({
    positionId: optionalUuid, incumbentEmployeeId: optionalUuid,
    criticality: z.enum(['normal', 'important', 'critical']), riskLevel: z.enum(['low', 'medium', 'high']).nullish(),
    notes: z.string().trim().max(4000).nullish(),
  }).partial().strict(),
  'talent-reviews': z.object({
    name: z.string().trim().min(2).max(200), reviewDate: date, configuration: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'internal-opportunities': z.object({
    positionId: optionalUuid, title: z.string().trim().min(2).max(240), description: z.string().trim().max(10000).nullish(),
    eligibilityRules: z.record(z.string(), z.unknown()), opensAt: z.string().datetime().nullish(), closesAt: z.string().datetime().nullish(),
  }).partial().strict(),
  'workforce-plans': z.object({
    name: z.string().trim().min(2).max(240), planningPeriodStart: date, planningPeriodEnd: date,
    scenario: z.string().trim().min(1).max(100), assumptions: z.record(z.string(), z.unknown()),
    demand: z.array(z.record(z.string(), z.unknown())), supply: z.array(z.record(z.string(), z.unknown())),
    costForecast: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'retention-policies': z.object({
    recordType: z.string().trim().min(2).max(120), retentionDays: z.number().int().min(1).max(36500),
    legalBasis: z.string().trim().min(2).max(1000), action: z.enum(['review', 'archive', 'anonymize', 'delete']),
    isActive: z.boolean(),
  }).partial().strict(),
  'privacy-requests': z.object({
    employeeId: optionalUuid, requestType: z.enum(['access', 'correction', 'export', 'restriction', 'deletion']),
    dueAt: z.string().datetime(), scope: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'integration-mappings': z.object({
    integrationType: z.enum(['identity', 'banking', 'accounting', 'benefits', 'time', 'payroll']),
    provider: z.string().trim().min(1).max(120), externalKey: z.string().trim().min(1).max(240),
    internalResource: z.string().trim().min(1).max(120), internalId: optionalUuid,
    configuration: z.record(z.string(), z.unknown()),
  }).partial().strict(),
  'feature-flags': z.object({ enabled: z.boolean(), configuration: z.record(z.string(), z.unknown()) }).partial().strict(),
} satisfies Record<HrisResourceName, z.ZodType<Record<string, unknown>>>;

export const hrisResourceStatusOptions: Record<HrisResourceName, readonly string[]> = {
  assignments: ['active', 'inactive', 'ended', 'corrected'],
  'employment-events': ['draft', 'pending', 'approved', 'applied', 'rejected', 'cancelled'],
  exits: ['draft', 'submitted', 'notice_received', 'approved', 'in_progress', 'final_settlement', 'completed', 'cancelled'],
  cases: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
  assets: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
  'asset-assignments': ['assigned', 'returned', 'lost'],
  'compensation-reviews': ['draft', 'open', 'under_review', 'approved', 'completed', 'cancelled'],
  'succession-plans': ['draft', 'active', 'archived'],
  'talent-reviews': ['draft', 'scheduled', 'in_progress', 'completed', 'archived'],
  'internal-opportunities': ['draft', 'published', 'closed', 'archived'],
  'workforce-plans': ['draft', 'active', 'approved', 'archived'],
  'retention-policies': [],
  'privacy-requests': ['received', 'in_progress', 'completed', 'closed', 'withdrawn', 'rejected'],
  'integration-mappings': ['active', 'inactive'],
  'feature-flags': [],
};

export function parseHrisResourceUpdate(resource: HrisResourceName, changes: unknown, status?: string) {
  const parsedChanges = updateSchemas[resource].safeParse(changes);
  if (!parsedChanges.success) return parsedChanges;
  const parsedStatus = z.string().refine(
    value => hrisResourceStatusOptions[resource].includes(value),
    { message: `Unsupported status for ${resource}.`, path: ['status'] },
  ).optional().safeParse(status);
  if (!parsedStatus.success) return parsedStatus;
  return { success: true as const, data: { changes: parsedChanges.data, status } };
}

export function isHrisResource(value: string): value is HrisResourceName {
  return (hrisResourceNames as readonly string[]).includes(value);
}

export function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

export function mapRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamelCase(key), value]));
}
