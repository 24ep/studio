import { z } from 'zod';

import { ATTENDANCE_CORRECTION_TYPES } from './attendance-correction';

export const ESS_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'pending_approval',
  'returned_for_revision',
  'approved',
  'rejected',
  'withdrawn',
  'cancelled',
  'processing',
  'completed',
] as const;

export type EssRequestStatus = (typeof ESS_REQUEST_STATUSES)[number];

export const ESS_REQUEST_TYPES = [
  'profile_change',
  'attendance_correction',
  'document_request',
  'performance_submission',
] as const;

export type EssRequestType = (typeof ESS_REQUEST_TYPES)[number];

const dateTimeValue = z.string().datetime({ offset: true }).or(z.string().datetime());
const evidenceUrl = z.string().min(1).max(2048).refine(
  value => value.startsWith('/') || /^https?:\/\//i.test(value),
  'Evidence must be a secure application path or URL.',
);

const profileChangeRequest = z.object({
  requestType: z.literal('profile_change'),
  title: z.string().min(3).max(140),
  reason: z.string().min(3).max(2000),
  values: z.record(z.string(), z.unknown()).refine(value => Object.keys(value).length > 0, 'At least one change is required.'),
  originalValues: z.record(z.string(), z.unknown()).default({}),
  saveAsDraft: z.boolean().default(false),
});

const attendanceCorrectionRequest = z.object({
  requestType: z.literal('attendance_correction'),
  title: z.string().min(3).max(140),
  reason: z.string().min(3).max(2000),
  values: z.object({
    workDate: z.string().date(),
    correctionType: z.enum(ATTENDANCE_CORRECTION_TYPES),
    attendanceRecordId: z.string().uuid().optional().nullable(),
    assignmentId: z.string().uuid().optional().nullable(),
    clockIn: dateTimeValue.optional().nullable(),
    clockOut: dateTimeValue.optional().nullable(),
    breakMinutes: z.coerce.number().int().min(0).max(720).optional().nullable(),
    workLocation: z.string().trim().max(120).optional().nullable(),
    requestedStatus: z.enum([
      'scheduled', 'present', 'late', 'absent', 'on_leave', 'working_remotely',
      'off_site', 'on_break', 'checked_out', 'missing_record', 'exception',
    ]).optional().nullable(),
  }).refine(
    value => !value.clockIn || !value.clockOut || new Date(value.clockOut) > new Date(value.clockIn),
    { message: 'Check-out must be after check-in.', path: ['clockOut'] },
  ),
  originalValues: z.record(z.string(), z.unknown()).default({}),
  supportingDocuments: z.array(z.object({
    name: z.string().min(1).max(200),
    url: evidenceUrl,
    size: z.string().max(40).optional(),
  })).max(10).default([]),
  saveAsDraft: z.boolean().default(false),
});

const documentRequest = z.object({
  requestType: z.literal('document_request'),
  title: z.string().min(3).max(140),
  reason: z.string().min(3).max(2000),
  values: z.object({
    documentType: z.enum(['employment_certificate', 'salary_certificate', 'visa_support_letter', 'tax_document', 'other_hr_letter']),
    purpose: z.string().min(2).max(1000),
    language: z.string().min(2).max(40),
    deliveryFormat: z.enum(['digital', 'printed', 'both']),
    additionalDetails: z.string().max(2000).optional().nullable(),
  }),
  originalValues: z.record(z.string(), z.unknown()).default({}),
  saveAsDraft: z.boolean().default(false),
});

const performanceRequest = z.object({
  requestType: z.literal('performance_submission'),
  title: z.string().min(3).max(140),
  reason: z.string().max(2000).default('Performance action submitted'),
  values: z.record(z.string(), z.unknown()),
  originalValues: z.record(z.string(), z.unknown()).default({}),
  saveAsDraft: z.boolean().default(false),
});

export const essRequestCreateSchema = z.discriminatedUnion('requestType', [
  profileChangeRequest,
  attendanceCorrectionRequest,
  documentRequest,
  performanceRequest,
]);

export const essRequestUpdateSchema = z.discriminatedUnion('requestType', [
  profileChangeRequest.omit({ originalValues: true, saveAsDraft: true }).extend({
    id: z.string().uuid(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  documentRequest.omit({ originalValues: true, saveAsDraft: true }).extend({
    id: z.string().uuid(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
]);

export const essRequestActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['submit', 'withdraw', 'cancel', 'resubmit', 'approve', 'reject', 'return_for_revision']),
  comment: z.string().max(2000).optional().nullable(),
  expectedVersion: z.coerce.number().int().positive(),
}).refine(
  value => !['reject', 'return_for_revision'].includes(value.action) || Boolean(value.comment?.trim()),
  { message: 'A comment is required for this decision.', path: ['comment'] },
);

export const essDocumentActionSchema = z.object({
  id: z.string().uuid(),
  action: z.literal('acknowledge'),
});

export const essPerformanceActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update_goal'),
    id: z.string().uuid(),
    progress: z.coerce.number().int().min(0).max(100),
    comment: z.string().max(2000).optional().nullable(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('submit_self_assessment'),
    id: z.string().uuid(),
    selfAssessment: z.string().min(20).max(12000),
    employeeComments: z.string().max(4000).optional().nullable(),
    developmentPlan: z.string().max(6000).optional().nullable(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('acknowledge_review'),
    id: z.string().uuid(),
    expectedVersion: z.coerce.number().int().positive(),
  }),
]);

export function maskSensitiveValue(value: unknown, visibleTail = 4) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  const raw = String(value);
  if (raw.length <= visibleTail) return '•'.repeat(Math.max(4, raw.length));
  return `${'•'.repeat(Math.min(8, raw.length - visibleTail))}${raw.slice(-visibleTail)}`;
}

export function hasProfileAttributeValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasProfileAttributeValue);
  }
  return true;
}

export function calculateProfileCompletion(values: Record<string, unknown>) {
  const { requiredAttributes, optionalAttributes } = profileCompletionAttributes(values);
  const attributes = [...requiredAttributes, ...optionalAttributes];

  const complete = attributes.filter(key => hasProfileAttributeValue(values[key])).length;
  return Math.round((complete / attributes.length) * 100);
}

function profileCompletionAttributes(values: Record<string, unknown>) {
  const requiredAttributes = [
    'employeeNumber', 'firstName', 'lastName', 'email', 'employmentType', 'status',
    'hireDate', 'departmentId', 'positionId', 'companyId', 'bankInformation',
  ];
  const optionalAttributes = [
    'preferredName', 'legalName', 'phone', 'location', 'personalEmail', 'personalPhone',
    'personalLocation', 'introduction', 'jobTitle',
    'managerId', 'businessUnit', 'workPhone', 'profilePhotoUrl', 'personalInformation',
    'address', 'emergencyContacts', 'familyDependents',
    'taxInformation', 'governmentIdentification', 'education', 'workExperience',
    'skills', 'certifications', 'languages',
  ];

  if (values.employmentType === 'subcontract') requiredAttributes.push('clientId');
  if (values.employmentType && values.employmentType !== 'full_time') requiredAttributes.push('endDate');
  if (values.status === 'probation') {
    requiredAttributes.push('probationPeriodDays', 'probationEvaluationFrequencyDays');
  }

  return { requiredAttributes, optionalAttributes };
}

export function calculateProfileCompletionBreakdown(values: Record<string, unknown>) {
  const { requiredAttributes, optionalAttributes } = profileCompletionAttributes(values);
  const percentage = (attributes: string[]) => Math.round(
    (attributes.filter(key => hasProfileAttributeValue(values[key])).length / attributes.length) * 100,
  );

  return {
    required: percentage(requiredAttributes),
    optional: percentage(optionalAttributes),
  };
}

export function createHumanRequestId(prefix: string, uuid: string) {
  return `${prefix}-${uuid.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

const requestTransitions: Record<string, Partial<Record<EssRequestStatus, EssRequestStatus>>> = {
  submit: { draft: 'pending_approval' },
  withdraw: {
    submitted: 'withdrawn',
    pending_approval: 'withdrawn',
    returned_for_revision: 'withdrawn',
  },
  cancel: { approved: 'cancelled', processing: 'cancelled' },
  resubmit: {
    returned_for_revision: 'pending_approval',
    withdrawn: 'pending_approval',
  },
  approve: { pending_approval: 'approved' },
  reject: { pending_approval: 'rejected' },
  return_for_revision: { pending_approval: 'returned_for_revision' },
};

export function getEssRequestTransition(action: string, status: EssRequestStatus) {
  return requestTransitions[action]?.[status] || null;
}
