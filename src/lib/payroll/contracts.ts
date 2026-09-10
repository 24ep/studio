import { z } from 'zod';

export const payrollResources = ['overview', 'runs', 'compensation', 'benefits', 'reports', 'payslips'] as const;
export type PayrollResource = typeof payrollResources[number];

export const payrollRunTypes = [
  'regular', 'off_cycle', 'supplemental', 'bonus', 'commission', 'correction',
  'retroactive', 'final', 'termination', 'reversal', 'simulation',
] as const;

const payrollPaymentMethodSchema = z
  .enum(['bank_transfer', 'cash', 'cheque', 'check'])
  .transform(value => value === 'check' ? 'cheque' : value);

export const createPayrollRunSchema = z.object({
  action: z.literal('create_run'),
  companyId: z.string().uuid().nullish(),
  payrollGroupId: z.string().uuid().nullish(),
  periodId: z.string().uuid(),
  runType: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9_-]+$/).default('regular'),
  idempotencyKey: z.string().trim().min(8).max(200),
});

export const createPayrollPeriodSchema = z.object({
  action: z.literal('create_period'),
  companyId: z.string().uuid().nullish(),
  payrollGroupId: z.string().uuid().nullish(),
  name: z.string().trim().min(2).max(160),
  startDate: z.string().date(),
  endDate: z.string().date(),
  payDate: z.string().date(),
});

export const createPayrollGroupSchema = z.object({
  action: z.literal('create_group'),
  companyId: z.string().uuid().nullish(),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  payFrequency: z.string().trim().min(2).max(40).default('monthly'),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()).default('THB'),
  timezone: z.string().trim().min(2).max(80).default('Asia/Bangkok'),
  paymentMethod: payrollPaymentMethodSchema.default('bank_transfer'),
});

export const assignPayrollProfileSchema = z.object({
  action: z.literal('assign_payroll_profile'),
  employeeId: z.string().uuid(),
  payrollGroupId: z.string().uuid(),
  paymentMethod: payrollPaymentMethodSchema,
  paymentCurrency: z.string().trim().length(3).transform(value => value.toUpperCase()).default('THB'),
  payrollStartDate: z.string().date(),
  bankAccountReference: z.string().trim().max(160).nullish(),
});

export const payrollRunActionSchema = z.object({
  action: z.enum(['collect_inputs', 'calculate', 'submit', 'approve', 'return', 'finalize', 'generate_outputs', 'release_payslips', 'mark_paid', 'reconcile', 'close', 'reverse']),
  runId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(2).max(2000),
  paymentReference: z.string().trim().min(2).max(200).optional(),
  evidenceReference: z.string().trim().min(2).max(500).optional(),
});

export const payrollGovernanceActionSchema = z.object({
  action: z.enum(['resolve_exception', 'waive_exception', 'resolve_variance', 'waive_variance', 'reassign_approval']),
  runId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  itemId: z.string().uuid(),
  reason: z.string().trim().min(2).max(2000),
  approverUserId: z.string().uuid().optional(),
});

export const compensationChangeSchema = z.object({
  action: z.enum(['create_change', 'submit_change', 'approve_change', 'reject_change']),
  id: z.string().uuid().optional(),
  expectedVersion: z.number().int().positive().optional(),
  employeeId: z.string().uuid().optional(),
  changeType: z.enum(['salary_increase', 'promotion', 'merit', 'market', 'cost_of_living', 'allowance', 'bonus', 'incentive', 'retention', 'correction']).optional(),
  proposedAmount: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default('THB'),
  effectiveDate: z.string().date().optional(),
  reason: z.string().trim().min(2).max(2000),
});

export const benefitActionSchema = z.object({
  action: z.enum(['create_plan', 'update_plan', 'enroll', 'approve_enrollment', 'return_enrollment', 'end_enrollment']),
  id: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  employeeIds: z.array(z.string().uuid()).min(1).max(1000).optional(),
  benefitPlanId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160).optional(),
  type: z.string().trim().min(2).max(80).optional(),
  employerCost: z.coerce.number().nonnegative().default(0),
  employeeCost: z.coerce.number().nonnegative().default(0),
  effectiveFrom: z.string().date().optional(),
  effectiveTo: z.string().date().optional(),
  description: z.string().trim().max(4000).optional(),
  providerCode: z.string().trim().max(160).optional(),
  isActive: z.boolean().optional(),
  eligibilityRules: z.record(z.string(), z.unknown()).optional(),
  enrollmentMode: z.enum(['rules', 'manual']).optional(),
  reason: z.string().trim().min(2).max(2000),
});

export const payrollActionSchema = z.discriminatedUnion('action', [
  createPayrollRunSchema,
  createPayrollPeriodSchema,
  createPayrollGroupSchema,
  assignPayrollProfileSchema,
  payrollRunActionSchema,
  payrollGovernanceActionSchema,
  compensationChangeSchema,
  benefitActionSchema,
]);

export type PayrollActionInput = z.infer<typeof payrollActionSchema>;

export interface PayrollAccess {
  canView: boolean;
  canViewAmounts: boolean;
  canManage: boolean;
  canApprove: boolean;
  canExport: boolean;
  isAdmin: boolean;
  actorCompanyId: string | null;
  actorEmployeeId: string | null;
  actorUserRole: string | null;
  actorJobTitle: string | null;
  actorDepartment: string | null;
}

export interface PayrollWorkspacePayload {
  resource: PayrollResource;
  generatedAt: string;
  companyId: string | null;
  access: Omit<PayrollAccess, 'actorCompanyId' | 'actorEmployeeId' | 'canViewAmounts'> & { canViewAmounts?: boolean };
  summary: Record<string, number | string | null>;
  records: Array<Record<string, unknown>>;
  secondary: Array<Record<string, unknown>>;
  issues: Array<Record<string, unknown>>;
  periods: Array<Record<string, unknown>>;
  groups: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
}
