import { z } from 'zod';

export const expenseResources = ['advances', 'claims', 'travel', 'accounting'] as const;
export type ExpenseResource = typeof expenseResources[number];

export const expenseCurrencies = ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD'] as const;

export const advanceStatuses = [
  'draft',
  'pending_manager_approval',
  'pending_finance_approval',
  'returned_for_revision',
  'approved',
  'rejected',
  'payment_processing',
  'paid',
  'partially_settled',
  'fully_settled',
  'overdue',
  'withdrawn',
  'cancelled',
  'reversed',
] as const;

export const claimStatuses = [
  'draft',
  'pending_manager_approval',
  'pending_finance_review',
  'returned_for_revision',
  'approved',
  'partially_approved',
  'rejected',
  'reimbursement_processing',
  'paid',
  'closed',
  'withdrawn',
  'cancelled',
  'reversed',
] as const;

export const travelStatuses = [
  'draft',
  'pending_manager_approval',
  'pending_finance_approval',
  'returned_for_revision',
  'approved',
  'in_progress',
  'completed',
  'awaiting_claim',
  'settlement_due',
  'settled',
  'rejected',
  'withdrawn',
  'cancelled',
] as const;

export const accountingStatuses = [
  'pending_generation',
  'validation_failed',
  'ready_for_review',
  'on_hold',
  'ready_to_export',
  'exported',
  'posted',
  'posting_failed',
  'reversed',
  'reconciled',
  'closed',
] as const;

const currencySchema = z.enum(expenseCurrencies);
const optionalUuid = z.string().uuid().nullish();
const optionalShortText = z.string().trim().max(240).nullish();
const moneySchema = z.coerce.number().finite().nonnegative().max(999_999_999.99);

export const advanceCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  purpose: z.string().trim().min(8).max(2000),
  advanceTypeId: z.string().uuid(),
  amount: moneySchema.positive(),
  currency: currencySchema,
  requiredDate: z.coerce.date(),
  settlementDueDate: z.coerce.date(),
  travelRequestId: optionalUuid,
  departmentId: optionalUuid,
  costCenterId: optionalUuid,
  projectId: optionalUuid,
  projectReference: optionalShortText,
  costCenter: optionalShortText,
  budgetReference: optionalShortText,
  paymentMethod: z.enum(['bank_transfer', 'payroll', 'cash', 'accounts_payable']),
  paymentDestination: z.string().trim().min(3).max(240),
  description: z.string().trim().max(4000).nullish(),
  saveAsDraft: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const claimItemSchema = z.object({
  id: z.string().uuid().optional(),
  expenseDate: z.coerce.date(),
  categoryId: z.string().uuid(),
  merchant: z.string().trim().min(2).max(160),
  description: z.string().trim().min(3).max(600),
  originalAmount: moneySchema.positive(),
  originalCurrency: currencySchema,
  exchangeRate: z.coerce.number().positive().max(1_000_000),
  taxAmount: moneySchema.default(0),
  taxType: z.string().trim().max(80).nullish(),
  taxInvoiceNumber: optionalShortText,
  merchantTaxId: optionalShortText,
  receiptNumber: optionalShortText,
  costCenterId: optionalUuid,
  projectId: optionalUuid,
  costCenter: optionalShortText,
  projectReference: optionalShortText,
  businessPurpose: z.string().trim().max(600).nullish(),
  attendeeCount: z.coerce.number().int().min(0).max(1000).default(0),
  personalPayment: z.boolean().default(true),
  billable: z.boolean().default(false),
  reimbursable: z.boolean().default(true),
  exceptionReason: z.string().trim().max(1000).nullish(),
});

export const claimCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  businessPurpose: z.string().trim().min(8).max(2000),
  claimCurrency: currencySchema,
  reimbursementCurrency: currencySchema,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  travelRequestId: optionalUuid,
  advanceId: optionalUuid,
  departmentId: optionalUuid,
  costCenterId: optionalUuid,
  projectId: optionalUuid,
  costCenter: optionalShortText,
  projectReference: optionalShortText,
  clientReference: optionalShortText,
  paymentMethod: z.enum(['bank_transfer', 'payroll', 'accounts_payable']),
  reimbursementDestination: z.string().trim().min(3).max(240),
  notes: z.string().trim().max(4000).nullish(),
  items: z.array(claimItemSchema).min(1).max(250),
  saveAsDraft: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(120),
}).refine(value => value.periodEnd >= value.periodStart, {
  message: 'Claim period end must be on or after its start.',
  path: ['periodEnd'],
});

export const travelCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  businessPurpose: z.string().trim().min(8).max(2000),
  justification: z.string().trim().min(8).max(2000),
  travelType: z.enum(['domestic', 'international']),
  origin: z.string().trim().min(2).max(160),
  destinations: z.array(z.string().trim().min(2).max(160)).min(1).max(12),
  departureAt: z.coerce.date(),
  returnAt: z.coerce.date(),
  departmentId: optionalUuid,
  costCenterId: optionalUuid,
  projectId: optionalUuid,
  costCenter: optionalShortText,
  projectReference: optionalShortText,
  clientReference: optionalShortText,
  estimatedAmount: moneySchema.positive(),
  currency: currencySchema,
  requestedAdvanceAmount: moneySchema.default(0),
  preferredTransport: optionalShortText,
  preferredAccommodation: optionalShortText,
  visaRequired: z.boolean().default(false),
  insuranceRequired: z.boolean().default(false),
  emergencyContact: z.string().trim().max(240).nullish(),
  itinerary: z.array(z.object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional(),
    type: z.enum(['flight', 'hotel', 'ground_transport', 'meeting', 'other']),
    title: z.string().trim().min(2).max(160),
    location: z.string().trim().max(240).nullish(),
    confirmationReference: optionalShortText,
  })).max(100).default([]),
  saveAsDraft: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(120),
}).refine(value => value.returnAt > value.departureAt, {
  message: 'Return date must be after departure.',
  path: ['returnAt'],
});

export const expenseActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum([
    'submit',
    'withdraw',
    'resubmit',
    'approve',
    'reject',
    'return_for_revision',
    'mark_payment_processing',
    'mark_paid',
    'settle',
    'place_on_hold',
    'generate_journal',
    'mark_ready_to_export',
    'mark_exported',
    'mark_posted',
    'mark_posting_failed',
    'reverse',
    'reconcile',
    'close',
    'cancel',
  ]),
  comment: z.string().trim().max(2000).nullish(),
  expectedVersion: z.coerce.number().int().positive(),
  approvedAmount: moneySchema.optional(),
  paymentReference: optionalShortText,
  externalReference: optionalShortText,
  settlementAmount: moneySchema.optional(),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export type AdvanceCreateInput = z.infer<typeof advanceCreateSchema>;
export type ClaimCreateInput = z.infer<typeof claimCreateSchema>;
export type ClaimItemInput = z.infer<typeof claimItemSchema>;
export type TravelCreateInput = z.infer<typeof travelCreateSchema>;
export type ExpenseActionInput = z.infer<typeof expenseActionSchema>;

export type PolicyResultLevel =
  | 'passed'
  | 'information'
  | 'warning'
  | 'explanation_required'
  | 'additional_approval_required'
  | 'blocked';

export interface ExpensePolicyResult {
  code: string;
  level: PolicyResultLevel;
  title: string;
  message: string;
  action?: string;
  itemIndex?: number;
  policyVersionId?: string;
}

export interface ExpenseRecord {
  id: string;
  reference: string;
  title: string;
  status: string;
  amount: number;
  approvedAmount?: number;
  currency: string;
  employeeName: string;
  employeeId: string;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  policyResults?: ExpensePolicyResult[];
  metadata?: Record<string, unknown>;
}

export interface ExpenseSummary {
  primaryAmount: number;
  primaryLabel: string;
  currency: string | null;
  drafts: number;
  pending: number;
  attention: number;
  completed: number;
  records: ExpenseRecord[];
  categories: Array<{ id: string; name: string; code: string; requiresReceipt: boolean }>;
  advanceTypes: Array<{ id: string; name: string; code: string }>;
  access: {
    canCreate: boolean;
    canApprove: boolean;
    canFinance: boolean;
    canAudit: boolean;
    scope: 'self' | 'team' | 'finance';
  };
}
