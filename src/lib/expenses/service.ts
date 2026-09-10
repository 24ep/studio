import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import { logAudit } from '@/lib/auditLog';
import type { SessionLikeUser } from '@/lib/permissions';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import {
  advanceCreateSchema,
  claimCreateSchema,
  expenseActionSchema,
  travelCreateSchema,
  type AdvanceCreateInput,
  type ClaimCreateInput,
  type ExpenseActionInput,
  type ExpensePolicyResult,
  type ExpenseRecord,
  type ExpenseResource,
  type ExpenseSummary,
  type TravelCreateInput,
} from './contracts';
import { calculateAdvanceSettlement, calculateClaimTotals, convertMoney, roundMoney } from './calculations';
import {
  defaultExpensePolicy,
  evaluateAdvancePolicy,
  evaluateClaimPolicy,
  evaluateTravelPolicy,
  hasBlockingPolicyResult,
  type ExpensePolicyConfig,
} from './policy-engine';
import { getExpenseAccess, maskPaymentDestination } from './permissions';

type DbClient = Prisma.TransactionClient | typeof prisma;
type EmployeeContext = {
  id: string;
  user_id: string | null;
  manager_id: string | null;
  company_id: string | null;
  department_id: string | null;
  status: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
};

type ExpenseSession = {
  id: string;
  email?: string | null;
  role?: string;
  modulePermissions?: string[];
};

const resourceConfig = {
  advances: {
    table: 'employee_advances',
    entityType: 'advance',
    amount: 'requested_amount',
    approvedAmount: 'approved_amount',
    currency: 'currency',
  },
  claims: {
    table: 'expense_claims',
    entityType: 'claim',
    amount: 'claimed_amount',
    approvedAmount: 'approved_amount',
    currency: 'claim_currency',
  },
  travel: {
    table: 'travel_requests',
    entityType: 'travel',
    amount: 'estimated_amount',
    approvedAmount: 'approved_budget',
    currency: 'currency',
  },
  accounting: {
    table: 'expense_accounting_entries',
    entityType: 'accounting',
    amount: 'total_debit',
    approvedAmount: 'total_credit',
    currency: 'currency',
  },
} as const;

async function requireContext(session: ExpenseSession) {
  const employee = await getEmployeeForUser(session.id, session.email) as unknown as EmployeeContext | null;
  const access = getExpenseAccess(session as SessionLikeUser, Boolean(employee));
  if (!employee && !access.canFinance && !access.canAudit) throw new Error('NO_EMPLOYEE');
  return { employee, access };
}

async function activePolicy(companyId?: string | null): Promise<ExpensePolicyConfig> {
  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    base_currency: string;
    configuration: Record<string, unknown>;
  }>>(
    `SELECT id, base_currency, configuration
     FROM "expense_policy_versions"
     WHERE status = 'active'
       AND effective_from <= CURRENT_DATE
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       AND (company_id = $1::uuid OR company_id IS NULL)
     ORDER BY (company_id IS NOT NULL) DESC, effective_from DESC, version DESC
     LIMIT 1`,
    companyId || null,
  ).catch(() => []);
  const row = rows[0];
  if (!row) return defaultExpensePolicy;
  const config = row.configuration || {};
  return {
    ...defaultExpensePolicy,
    ...config,
    versionId: row.id,
    baseCurrency: row.base_currency || defaultExpensePolicy.baseCurrency,
    allowedCurrencies: Array.isArray(config.allowedCurrencies)
      ? config.allowedCurrencies.map(String)
      : defaultExpensePolicy.allowedCurrencies,
    categoryLimits: typeof config.categoryLimits === 'object' && config.categoryLimits
      ? config.categoryLimits as Record<string, number>
      : {},
  };
}

function readableReference(prefix: string) {
  return `${prefix}-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function managerUserId(client: DbClient, managerEmployeeId: string | null) {
  if (!managerEmployeeId) return null;
  const rows = await client.$queryRawUnsafe<Array<{ user_id: string | null }>>(
    `SELECT user_id FROM "hr_employees" WHERE id = $1::uuid LIMIT 1`,
    managerEmployeeId,
  );
  return rows[0]?.user_id || null;
}

async function addActivity(
  client: DbClient,
  entityType: string,
  entityId: string,
  actorUserId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string,
  idempotencyKey: string,
  comment?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await client.$executeRawUnsafe(
    `INSERT INTO "expense_activities"
      (id, entity_type, entity_id, actor_user_id, action, from_status, to_status,
       comment, metadata, idempotency_key, created_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9::jsonb, $10, CURRENT_TIMESTAMP)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    randomUUID(),
    entityType,
    entityId,
    actorUserId,
    action,
    fromStatus,
    toStatus,
    comment || null,
    JSON.stringify(metadata),
    idempotencyKey,
  );
}

async function createApprovalSteps(
  client: DbClient,
  entityType: string,
  entityId: string,
  managerId: string | null,
  policyResults: ExpensePolicyResult[],
  amount: number,
) {
  const steps = managerId
    ? [
        { sequence: 1, role: 'manager', approver: managerId },
        { sequence: 2, role: 'finance', approver: null },
      ]
    : [{ sequence: 1, role: 'finance', approver: null }];
  for (const step of steps) {
    await client.$executeRawUnsafe(
      `INSERT INTO "expense_approvals"
        (id, entity_type, entity_id, sequence, approval_role, approver_user_id,
         status, policy_context, amount_context, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6::uuid,
               $7, $8::jsonb, $9::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (entity_type, entity_id, sequence, approval_role) DO NOTHING`,
      randomUUID(),
      entityType,
      entityId,
      step.sequence,
      step.role,
      step.approver,
      step.sequence === 1 ? 'pending' : 'queued',
      JSON.stringify(policyResults),
      JSON.stringify({ requestedAmount: amount }),
    );
  }
}

function mapRecord(row: Record<string, unknown>): ExpenseRecord {
  return {
    id: String(row.id),
    reference: String(row.reference),
    title: String(row.title || row.source_reference || 'Accounting entry'),
    status: String(row.status),
    amount: Number(row.amount || 0),
    approvedAmount: row.approved_amount === null || row.approved_amount === undefined
      ? undefined
      : Number(row.approved_amount),
    currency: String(row.currency || 'THB'),
    employeeName: String(row.employee_name || 'Finance journal'),
    employeeId: String(row.employee_id || ''),
    companyId: row.company_id ? String(row.company_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    version: Number(row.version || 1),
    policyResults: Array.isArray(row.policy_results)
      ? row.policy_results as ExpensePolicyResult[]
      : [],
    metadata: (row.metadata || {}) as Record<string, unknown>,
  };
}

export async function listExpenseWorkspace(input: {
  resource: ExpenseResource;
  session: ExpenseSession;
  scope?: string | null;
  search?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<ExpenseSummary> {
  const { employee, access } = await requireContext(input.session);
  if (input.resource === 'accounting' && !access.canFinance && !access.canAudit) throw new Error('FORBIDDEN');
  const config = resourceConfig[input.resource];
  const requestedScope = input.scope === 'finance' || input.scope === 'team' ? input.scope : 'self';
  const scope = access.canFinance && requestedScope === 'finance'
    ? 'finance'
    : access.canApprove && requestedScope === 'team'
      ? 'team'
      : 'self';
  const pageSize = Math.min(Math.max(input.pageSize || 50, 1), 100);
  const offset = Math.max((input.page || 1) - 1, 0) * pageSize;
  const values: unknown[] = [];
  let accessSql = 'FALSE';
  if (input.resource === 'accounting') {
    accessSql = access.canFinance || access.canAudit
      ? employee?.company_id
        ? `(r.company_id = $${values.push(employee.company_id)}::uuid OR r.company_id IS NULL)`
        : 'TRUE'
      : 'FALSE';
  } else if (scope === 'finance') {
    accessSql = employee?.company_id
      ? `(r.company_id = $${values.push(employee.company_id)}::uuid OR r.company_id IS NULL)`
      : 'TRUE';
  } else if (scope === 'team' && employee) {
    accessSql = `(r.employee_id = $${values.push(employee.id)}::uuid OR e.manager_id = $${values.push(employee.id)}::uuid
      OR EXISTS (
        SELECT 1 FROM expense_approvals ap
        WHERE ap.entity_type = '${config.entityType}' AND ap.entity_id = r.id
          AND ap.approver_user_id = $${values.push(input.session.id)}::uuid
      ))`;
  } else if (employee) {
    accessSql = `(r.employee_id = $${values.push(employee.id)}::uuid
      OR EXISTS (
        SELECT 1 FROM expense_approvals ap
        WHERE ap.entity_type = '${config.entityType}' AND ap.entity_id = r.id
          AND ap.approver_user_id = $${values.push(input.session.id)}::uuid
      ))`;
  }
  const filters = [accessSql];
  if (input.status) filters.push(`r.status = $${values.push(input.status)}`);
  if (input.search) {
    const searchIndex = values.push(`%${input.search.trim()}%`);
    filters.push(`(r.reference ILIKE $${searchIndex} OR ${input.resource === 'accounting' ? 'r.source_reference' : 'r.title'} ILIKE $${searchIndex})`);
  }
  const join = input.resource === 'accounting'
    ? ''
    : `JOIN "hr_employees" e ON e.id = r.employee_id`;
  const employeeSelect = input.resource === 'accounting'
    ? `NULL::text AS employee_name, NULL::uuid AS employee_id`
    : `concat_ws(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS employee_name, e.id AS employee_id`;
  const titleSelect = input.resource === 'accounting'
    ? `r.source_reference AS title,
       jsonb_build_object('journalType', r.journal_type, 'validationResults', r.validation_results,
                          'externalReference', r.external_posting_reference,
                          'postingError', r.posting_error, 'totalCredit', r.total_credit) AS metadata,
       '[]'::jsonb AS policy_results`
    : `r.title, '{}'::jsonb AS metadata, r.policy_results`;
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT r.id, r.reference, ${titleSelect}, r.status,
            r.${config.amount} AS amount, r.${config.approvedAmount} AS approved_amount,
            r.${config.currency} AS currency, r.company_id, r.version, r.created_at, r.updated_at,
            ${employeeSelect}
     FROM "${config.table}" r
     ${join}
     WHERE ${filters.join(' AND ')}
     ORDER BY r.updated_at DESC
     LIMIT $${values.push(pageSize)} OFFSET $${values.push(offset)}`,
    ...values,
  ).catch((error: unknown) => {
    if (error instanceof Error && /does not exist/i.test(error.message)) throw new Error('MIGRATION_REQUIRED');
    throw error;
  });
  const records = rows.map(mapRecord);
  const [categories, advanceTypes] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ id: string; name: string; code: string; requires_receipt: boolean }>>(
      `SELECT id, name, code, requires_receipt FROM "expense_categories" WHERE is_active = TRUE ORDER BY sort_order, name`,
    ),
    prisma.$queryRawUnsafe<Array<{ id: string; name: string; code: string }>>(
      `SELECT id, name, code FROM "expense_advance_types" WHERE is_active = TRUE ORDER BY sort_order, name`,
    ),
  ]);
  const pendingStatuses = ['pending_manager_approval', 'pending_finance_approval', 'pending_finance_review', 'ready_for_review', 'ready_to_export'];
  const attentionStatuses = ['returned_for_revision', 'overdue', 'validation_failed', 'posting_failed', 'settlement_due'];
  const completedStatuses = ['paid', 'fully_settled', 'settled', 'posted', 'reconciled', 'closed'];
  return {
    primaryAmount: roundMoney(records
      .filter(record => !['draft', 'withdrawn', 'cancelled', 'rejected'].includes(record.status))
      .reduce((sum, record) => sum + record.amount, 0)),
    primaryLabel: input.resource === 'advances'
      ? 'Outstanding requested'
      : input.resource === 'claims'
        ? 'Claims in view'
        : input.resource === 'travel'
          ? 'Estimated travel'
          : 'Journals in view',
    currency: records.length > 0 && records.every(record => record.currency === records[0].currency)
      ? records[0].currency
      : null,
    drafts: records.filter(record => record.status === 'draft').length,
    pending: records.filter(record => pendingStatuses.includes(record.status)).length,
    attention: records.filter(record => attentionStatuses.includes(record.status)).length,
    completed: records.filter(record => completedStatuses.includes(record.status)).length,
    records,
    categories: categories.map(item => ({
      id: item.id,
      name: item.name,
      code: item.code,
      requiresReceipt: item.requires_receipt,
    })),
    advanceTypes,
    access: {
      canCreate: access.canCreate && input.resource !== 'accounting',
      canApprove: access.canApprove,
      canFinance: access.canFinance,
      canAudit: access.canAudit,
      scope,
    },
  };
}

export async function createAdvance(session: ExpenseSession, rawInput: unknown) {
  const input = advanceCreateSchema.parse(rawInput);
  const { employee, access } = await requireContext(session);
  if (!employee || !access.canCreate) throw new Error('FORBIDDEN');
  const policy = await activePolicy(employee.company_id);
  const outstandingRows = await prisma.$queryRawUnsafe<Array<{ amount: unknown; overdue: boolean }>>(
    `SELECT COALESCE(SUM(GREATEST(issued_amount - settled_amount, 0)), 0) AS amount,
            COALESCE(BOOL_OR(settlement_due_date < CURRENT_DATE AND status IN ('paid', 'partially_settled', 'overdue')), FALSE) AS overdue
     FROM employee_advances WHERE employee_id = $1::uuid`,
    employee.id,
  );
  const policyResults = evaluateAdvancePolicy(input, policy, {
    outstandingAmount: Number(outstandingRows[0]?.amount || 0),
    employeeActive: employee.status === 'active',
    hasOverdueAdvance: Boolean(outstandingRows[0]?.overdue),
  });
  if (!input.saveAsDraft && hasBlockingPolicyResult(policyResults)) throw new ExpensePolicyError(policyResults);
  const managerId = await managerUserId(prisma, employee.manager_id);
  const status = input.saveAsDraft ? 'draft' : managerId ? 'pending_manager_approval' : 'pending_finance_approval';
  const id = randomUUID();
  const reference = readableReference('ADV');
  const row = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO employee_advances
        (id, reference, employee_id, company_id, advance_type_id, travel_request_id, title, purpose,
         description, requested_amount, currency, required_date, settlement_due_date, department_id,
         cost_center, project_reference, budget_reference, payment_method, payment_destination,
         cost_center_id, project_id, status, policy_results, idempotency_key, submitted_at, created_at, updated_at)
       VALUES
        ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8,
         $9, $10, $11, $12, $13, $14::uuid, $15, $16, $17, $18, $19,
         $20::uuid, $21::uuid, $22, $23::jsonb, $24, CASE WHEN $22 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      id, reference, employee.id, employee.company_id, input.advanceTypeId, input.travelRequestId || null,
      input.title, input.purpose, input.description || null, input.amount, input.currency,
      input.requiredDate, input.settlementDueDate, input.departmentId || employee.department_id,
      input.costCenter || null, input.projectReference || null, input.budgetReference || null,
      input.paymentMethod, input.paymentDestination, input.costCenterId || null, input.projectId || null,
      status, JSON.stringify(policyResults), input.idempotencyKey,
    );
    const created = rows[0];
    if (!input.saveAsDraft) await createApprovalSteps(tx, 'advance', String(created.id), managerId, policyResults, input.amount);
    await addActivity(tx, 'advance', String(created.id), session.id, input.saveAsDraft ? 'draft_saved' : 'submitted', null, status, `${input.idempotencyKey}:activity`);
    return created;
  });
  await notifyApprover(managerId, session.id, 'Advance needs your review', `${reference} is awaiting your decision.`, `/expenses/advances?id=${row.id}`);
  await auditExpense(session.id, 'Advance created', 'Advance', String(row.id), { reference, status });
  return row;
}

export async function createClaim(session: ExpenseSession, rawInput: unknown) {
  const input = claimCreateSchema.parse(rawInput);
  const { employee, access } = await requireContext(session);
  if (!employee || !access.canCreate) throw new Error('FORBIDDEN');
  const policy = await activePolicy(employee.company_id);
  const advanceRows = input.advanceId
    ? await prisma.$queryRawUnsafe<Array<{ balance: unknown }>>(
        `SELECT GREATEST(issued_amount - settled_amount, 0) AS balance
         FROM employee_advances WHERE id = $1::uuid AND employee_id = $2::uuid
           AND status IN ('paid', 'partially_settled', 'overdue')`,
        input.advanceId, employee.id,
      )
    : [];
  const duplicateRows = await Promise.all(input.items.map(item =>
    prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM expense_claim_items i
         JOIN expense_claims c ON c.id = i.claim_id
         WHERE c.employee_id = $1::uuid AND c.status NOT IN ('cancelled', 'rejected')
           AND i.expense_date = $2::date AND lower(i.merchant) = lower($3)
           AND i.original_amount = $4 AND i.original_currency = $5
       ) AS exists`,
      employee.id, item.expenseDate, item.merchant, item.originalAmount, item.originalCurrency,
    ),
  ));
  const policyResults = evaluateClaimPolicy(input, policy, {
    receiptItemIndexes: [],
    duplicateItemIndexes: duplicateRows.flatMap((rows, index) => rows[0]?.exists ? [index] : []),
  });
  if (!input.saveAsDraft && hasBlockingPolicyResult(policyResults)) throw new ExpensePolicyError(policyResults);
  const totals = calculateClaimTotals(input.items, Number(advanceRows[0]?.balance || 0));
  const managerId = await managerUserId(prisma, employee.manager_id);
  const status = input.saveAsDraft ? 'draft' : managerId ? 'pending_manager_approval' : 'pending_finance_review';
  const id = randomUUID();
  const reference = readableReference('CLM');
  const row = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO expense_claims
        (id, reference, employee_id, company_id, title, business_purpose, period_start, period_end,
         travel_request_id, advance_id, department_id, cost_center, project_reference, client_reference,
         claim_currency, reimbursement_currency, claimed_amount, eligible_amount, advance_offset,
         employee_reimbursement, employee_repayment, payment_method, reimbursement_destination, notes,
         cost_center_id, project_id, status, policy_results, idempotency_key, submitted_at, created_at, updated_at)
       VALUES
        ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9::uuid, $10::uuid, $11::uuid,
         $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
         $25::uuid, $26::uuid, $27, $28::jsonb, $29, CASE WHEN $27 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      id, reference, employee.id, employee.company_id, input.title, input.businessPurpose,
      input.periodStart, input.periodEnd, input.travelRequestId || null, input.advanceId || null,
      input.departmentId || employee.department_id, input.costCenter || null, input.projectReference || null,
      input.clientReference || null, input.claimCurrency, input.reimbursementCurrency, totals.claimedAmount,
      totals.eligibleAmount, totals.advanceOffset, totals.employeeReimbursement, totals.employeeRepayment,
      input.paymentMethod, input.reimbursementDestination, input.notes || null,
      input.costCenterId || null, input.projectId || null, status,
      JSON.stringify(policyResults), input.idempotencyKey,
    );
    for (const item of input.items) {
      await tx.$executeRawUnsafe(
        `INSERT INTO expense_claim_items
          (id, claim_id, category_id, expense_date, merchant, description, original_amount,
           original_currency, exchange_rate, converted_amount, tax_amount, tax_type, tax_invoice_number,
           merchant_tax_id, receipt_number, cost_center, project_reference, business_purpose,
           attendee_count, personal_payment, billable, reimbursable, exception_reason,
           cost_center_id, project_id, created_at, updated_at)
         VALUES
          ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
           $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::uuid, $25::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        item.id || randomUUID(), id, item.categoryId, item.expenseDate, item.merchant, item.description,
        item.originalAmount, item.originalCurrency, item.exchangeRate,
        convertMoney(item.originalAmount, item.exchangeRate), item.taxAmount, item.taxType || null,
        item.taxInvoiceNumber || null, item.merchantTaxId || null, item.receiptNumber || null,
        item.costCenter || input.costCenter || null, item.projectReference || input.projectReference || null,
        item.businessPurpose || input.businessPurpose, item.attendeeCount, item.personalPayment,
        item.billable, item.reimbursable, item.exceptionReason || null,
        item.costCenterId || input.costCenterId || null, item.projectId || input.projectId || null,
      );
    }
    if (!input.saveAsDraft) await createApprovalSteps(tx, 'claim', id, managerId, policyResults, totals.claimedAmount);
    await addActivity(tx, 'claim', id, session.id, input.saveAsDraft ? 'draft_saved' : 'submitted', null, status, `${input.idempotencyKey}:activity`, null, totals);
    return rows[0];
  });
  await notifyApprover(managerId, session.id, 'Expense claim needs your review', `${reference} is awaiting your decision.`, `/expenses/claims?id=${row.id}`);
  await auditExpense(session.id, 'Expense claim created', 'ExpenseClaim', String(row.id), { reference, status, totals });
  return row;
}

export async function createTravel(session: ExpenseSession, rawInput: unknown) {
  const input = travelCreateSchema.parse(rawInput);
  const { employee, access } = await requireContext(session);
  if (!employee || !access.canCreate) throw new Error('FORBIDDEN');
  const policy = await activePolicy(employee.company_id);
  const overlapRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM travel_requests
       WHERE employee_id = $1::uuid AND status NOT IN ('cancelled', 'rejected', 'withdrawn')
         AND departure_at < $3 AND return_at > $2
     ) AS exists`,
    employee.id, input.departureAt, input.returnAt,
  );
  const policyResults = evaluateTravelPolicy(input, policy, {
    employeeActive: employee.status === 'active',
    overlappingTrip: Boolean(overlapRows[0]?.exists),
  });
  if (!input.saveAsDraft && hasBlockingPolicyResult(policyResults)) throw new ExpensePolicyError(policyResults);
  const managerId = await managerUserId(prisma, employee.manager_id);
  const status = input.saveAsDraft ? 'draft' : managerId ? 'pending_manager_approval' : 'pending_finance_approval';
  const id = randomUUID();
  const reference = readableReference('TRV');
  const row = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO travel_requests
        (id, reference, employee_id, company_id, title, business_purpose, justification, travel_type,
         origin, destinations, departure_at, return_at, department_id, cost_center, project_reference,
         client_reference, estimated_amount, currency, requested_advance_amount, preferred_transport,
         preferred_accommodation, visa_required, insurance_required, emergency_contact, itinerary,
         cost_center_id, project_id, status, policy_results, idempotency_key, submitted_at, created_at, updated_at)
       VALUES
        ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10::jsonb, $11, $12,
         $13::uuid, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25::jsonb,
         $26::uuid, $27::uuid, $28, $29::jsonb, $30, CASE WHEN $28 = 'draft' THEN NULL ELSE CURRENT_TIMESTAMP END,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING *`,
      id, reference, employee.id, employee.company_id, input.title, input.businessPurpose,
      input.justification, input.travelType, input.origin, JSON.stringify(input.destinations),
      input.departureAt, input.returnAt, input.departmentId || employee.department_id,
      input.costCenter || null, input.projectReference || null, input.clientReference || null,
      input.estimatedAmount, input.currency, input.requestedAdvanceAmount,
      input.preferredTransport || null, input.preferredAccommodation || null, input.visaRequired,
      input.insuranceRequired, input.emergencyContact || null, JSON.stringify(input.itinerary),
      input.costCenterId || null, input.projectId || null, status, JSON.stringify(policyResults), input.idempotencyKey,
    );
    if (!input.saveAsDraft) await createApprovalSteps(tx, 'travel', id, managerId, policyResults, input.estimatedAmount);
    await addActivity(tx, 'travel', id, session.id, input.saveAsDraft ? 'draft_saved' : 'submitted', null, status, `${input.idempotencyKey}:activity`);
    return rows[0];
  });
  await notifyApprover(managerId, session.id, 'Travel request needs your review', `${reference} is awaiting your decision.`, `/expenses/travel?id=${row.id}`);
  await auditExpense(session.id, 'Travel request created', 'TravelRequest', String(row.id), { reference, status });
  return row;
}

export async function actOnExpense(resource: ExpenseResource, session: ExpenseSession, rawInput: unknown) {
  const input = expenseActionSchema.parse(rawInput);
  const { employee, access } = await requireContext(session);
  if (resource === 'accounting') {
    if (!access.canFinance || access.readOnly) throw new Error('FORBIDDEN');
    return actOnAccounting(session, input);
  }
  const config = resourceConfig[resource];
  const result = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<Record<string, unknown> & {
      id: string;
      employee_id: string;
      company_id: string | null;
      status: string;
      version: number;
      reference: string;
      title: string;
    }>>(
      `SELECT r.*, e.user_id AS employee_user_id, e.manager_id
       FROM "${config.table}" r
       JOIN hr_employees e ON e.id = r.employee_id
       WHERE r.id = $1::uuid
       FOR UPDATE`,
      input.id,
    );
    const row = rows[0];
    if (!row) throw new Error('NOT_FOUND');
    if (row.version !== input.expectedVersion) throw new Error('CONFLICT');
    const isOwner = employee?.id === row.employee_id;
    const pendingApprovalRows = await tx.$queryRawUnsafe<Array<{
      id: string;
      approval_role: string;
      approver_user_id: string | null;
      sequence: number;
    }>>(
      `SELECT id, approval_role, approver_user_id, sequence
       FROM expense_approvals
       WHERE entity_type = $1 AND entity_id = $2::uuid AND status = 'pending'
       ORDER BY sequence LIMIT 1`,
      config.entityType, input.id,
    );
    const approval = pendingApprovalRows[0];
    const isAssignedApprover = approval?.approver_user_id === session.id;
    const ownerActions = ['submit', 'withdraw', 'resubmit', 'cancel'];
    const financeActions = ['mark_payment_processing', 'mark_paid', 'settle'];
    if (ownerActions.includes(input.action) && !isOwner) throw new Error('FORBIDDEN');
    if (financeActions.includes(input.action) && !access.canFinance) throw new Error('FORBIDDEN');
    if (['approve', 'reject', 'return_for_revision'].includes(input.action)) {
      const financeStep = approval?.approval_role === 'finance';
      if (!isAssignedApprover && !(financeStep && access.canFinance) && !access.isAdmin) throw new Error('FORBIDDEN');
    }
    if (['reject', 'return_for_revision', 'cancel'].includes(input.action) && !input.comment?.trim()) {
      throw new Error('COMMENT_REQUIRED');
    }
    const storedPolicyResults = Array.isArray(row.policy_results)
      ? row.policy_results as ExpensePolicyResult[]
      : [];
    if (['submit', 'resubmit'].includes(input.action) && hasBlockingPolicyResult(storedPolicyResults)) {
      throw new ExpensePolicyError(storedPolicyResults);
    }
    let nextStatus = nextExpenseStatus(resource, row.status, input.action, Boolean(approval?.approval_role === 'manager'));
    if (!nextStatus) throw new Error('INVALID_TRANSITION');
    if (['submit', 'resubmit'].includes(input.action)) {
      const submitManagerId = await managerUserId(tx, String(row.manager_id || '') || null);
      await createApprovalSteps(
        tx,
        config.entityType,
        input.id,
        submitManagerId,
        storedPolicyResults,
        Number(row[config.amount] || 0),
      );
      nextStatus = submitManagerId
        ? 'pending_manager_approval'
        : resource === 'claims'
          ? 'pending_finance_review'
          : 'pending_finance_approval';
    }
    if (input.action === 'approve' && approval) {
      await tx.$executeRawUnsafe(
        `UPDATE expense_approvals SET status = 'approved', decision = 'approved', comment = $2,
                acted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        approval.id, input.comment || null,
      );
      await tx.$executeRawUnsafe(
        `UPDATE expense_approvals SET status = 'pending', updated_at = CURRENT_TIMESTAMP
         WHERE entity_type = $1 AND entity_id = $2::uuid AND sequence = $3`,
        config.entityType, input.id, approval.sequence + 1,
      );
    }
    if (['reject', 'return_for_revision'].includes(input.action) && approval) {
      await tx.$executeRawUnsafe(
        `UPDATE expense_approvals SET status = $2, decision = $2, comment = $3,
                acted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        approval.id, input.action === 'reject' ? 'rejected' : 'returned_for_revision', input.comment,
      );
    }
    if (input.action === 'mark_paid' && resource === 'advances') {
      const amount = Number(row.approved_amount || row.requested_amount || 0);
      await tx.$executeRawUnsafe(
        `INSERT INTO advance_transactions
          (id, advance_id, transaction_type, amount, currency, payment_reference,
           idempotency_key, created_by_user_id, created_at)
         VALUES ($1::uuid, $2::uuid, 'issuance', $3, $4, $5, $6, $7::uuid, CURRENT_TIMESTAMP)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        randomUUID(), input.id, amount, row.currency, input.paymentReference || null,
        `${input.idempotencyKey}:issuance`, session.id,
      );
      await tx.$executeRawUnsafe(
        `UPDATE employee_advances SET issued_amount = $2, payment_status = 'paid',
                payment_reference = $3, paid_at = CURRENT_TIMESTAMP
         WHERE id = $1::uuid`,
        input.id, amount, input.paymentReference || null,
      );
    }
    if (input.action === 'settle' && resource === 'advances') {
      const settlement = calculateAdvanceSettlement({
        issuedAmount: Number(row.issued_amount || 0),
        previouslySettledAmount: Number(row.settled_amount || 0),
        eligibleExpenseAmount: Number(input.settlementAmount || 0),
      });
      await tx.$executeRawUnsafe(
        `INSERT INTO advance_transactions
          (id, advance_id, transaction_type, amount, currency, notes,
           idempotency_key, created_by_user_id, created_at)
         VALUES ($1::uuid, $2::uuid, 'settlement', $3, $4, $5, $6, $7::uuid, CURRENT_TIMESTAMP)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        randomUUID(), input.id, settlement.settledNow, row.currency, input.comment || null,
        `${input.idempotencyKey}:settlement`, session.id,
      );
      await tx.$executeRawUnsafe(
        `UPDATE employee_advances SET settled_amount = settled_amount + $2 WHERE id = $1::uuid`,
        input.id, settlement.settledNow,
      );
    }
    const approvedAmount = input.action === 'approve'
      ? Number(input.approvedAmount ?? row.approved_amount ?? row[config.amount] ?? 0)
      : null;
    await tx.$executeRawUnsafe(
      `UPDATE "${config.table}"
       SET status = $2,
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP,
           ${config.approvedAmount} = CASE WHEN $3::numeric IS NULL THEN ${config.approvedAmount} ELSE $3 END,
           approved_at = CASE WHEN $2 IN ('approved', 'partially_approved') THEN CURRENT_TIMESTAMP ELSE approved_at END
       WHERE id = $1::uuid`,
      input.id, nextStatus, approvedAmount,
    );
    if (resource === 'claims' && nextStatus === 'approved') {
      await createReimbursementAndJournal(tx, row, approvedAmount || Number(row.eligible_amount || 0));
    }
    if (resource === 'claims' && input.action === 'mark_paid') {
      await tx.$executeRawUnsafe(
        `UPDATE expense_reimbursements SET status = 'paid', payment_reference = $2,
                paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE claim_id = $1::uuid`,
        input.id, input.paymentReference || null,
      );
    }
    await addActivity(tx, config.entityType, input.id, session.id, input.action, row.status, nextStatus, input.idempotencyKey, input.comment, {
      approvedAmount: input.approvedAmount,
      paymentReference: input.paymentReference,
    });
    return { row, nextStatus };
  });
  const employeeUserId = result.row.employee_user_id ? String(result.row.employee_user_id) : null;
  await notifyApprover(employeeUserId, session.id, `${result.row.reference} updated`, `Status: ${result.nextStatus.replace(/_/g, ' ')}.`, `/expenses/${resource}?id=${input.id}`);
  await auditExpense(session.id, `Expense ${input.action}`, config.entityType, input.id, {
    fromStatus: result.row.status,
    toStatus: result.nextStatus,
    comment: input.comment,
  });
  return { id: input.id, status: result.nextStatus, version: input.expectedVersion + 1 };
}

function nextExpenseStatus(resource: Exclude<ExpenseResource, 'accounting'>, current: string, action: ExpenseActionInput['action'], managerStep: boolean) {
  const submitTarget = resource === 'claims' ? 'pending_finance_review' : 'pending_finance_approval';
  if (action === 'submit' && current === 'draft') return 'pending_manager_approval';
  if (action === 'resubmit' && ['returned_for_revision', 'withdrawn'].includes(current)) return 'pending_manager_approval';
  if (action === 'withdraw' && current.startsWith('pending_')) return 'withdrawn';
  if (action === 'cancel' && ['draft', 'approved'].includes(current)) return 'cancelled';
  if (action === 'return_for_revision' && current.startsWith('pending_')) return 'returned_for_revision';
  if (action === 'reject' && current.startsWith('pending_')) return 'rejected';
  if (action === 'approve' && current.startsWith('pending_')) return managerStep ? submitTarget : 'approved';
  if (action === 'mark_payment_processing' && current === 'approved') {
    return resource === 'claims' ? 'reimbursement_processing' : 'payment_processing';
  }
  if (action === 'mark_paid' && ['approved', 'payment_processing', 'reimbursement_processing'].includes(current)) return 'paid';
  if (action === 'settle' && resource === 'advances' && ['paid', 'partially_settled', 'overdue'].includes(current)) return 'partially_settled';
  return null;
}

async function createReimbursementAndJournal(
  tx: Prisma.TransactionClient,
  claim: Record<string, unknown>,
  approvedAmount: number,
) {
  const advanceOffset = Math.min(Number(claim.advance_offset || 0), approvedAmount);
  const reimbursementAmount = Math.max(approvedAmount - advanceOffset, 0);
  await tx.$executeRawUnsafe(
    `INSERT INTO expense_reimbursements
      (id, claim_id, employee_id, company_id, approved_amount, advance_offset,
       reimbursement_amount, repayment_amount, currency, payment_method,
       masked_payment_destination, status, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, $11,
             'ready_for_payment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (claim_id) DO UPDATE SET
       approved_amount = EXCLUDED.approved_amount,
       advance_offset = EXCLUDED.advance_offset,
       reimbursement_amount = EXCLUDED.reimbursement_amount,
       repayment_amount = EXCLUDED.repayment_amount,
       updated_at = CURRENT_TIMESTAMP`,
    randomUUID(), claim.id, claim.employee_id, claim.company_id, approvedAmount, advanceOffset,
    reimbursementAmount, Number(claim.employee_repayment || 0), claim.reimbursement_currency,
    claim.payment_method, maskPaymentDestination(String(claim.reimbursement_destination || '')),
  );
  await tx.$executeRawUnsafe(
    `INSERT INTO expense_accounting_entries
      (id, reference, company_id, source_type, source_id, source_reference, journal_type,
       posting_date, document_date, accounting_period, currency, total_debit, total_credit,
       status, validation_results, created_at, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, 'expense_claim', $4::uuid, $5, 'expense_reimbursement',
             CURRENT_DATE, CURRENT_DATE, to_char(CURRENT_DATE, 'YYYY-MM'), $6, $7, $7,
             'pending_generation', '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (source_type, source_id, journal_type) DO NOTHING`,
    randomUUID(), readableReference('JRN'), claim.company_id, claim.id, claim.reference,
    claim.reimbursement_currency, approvedAmount,
  );
}

async function actOnAccounting(session: ExpenseSession, input: ExpenseActionInput) {
  const statusByAction: Partial<Record<ExpenseActionInput['action'], string>> = {
    generate_journal: 'ready_for_review',
    place_on_hold: 'on_hold',
    mark_ready_to_export: 'ready_to_export',
    mark_exported: 'exported',
    mark_posted: 'posted',
    mark_posting_failed: 'posting_failed',
    reverse: 'reversed',
    reconcile: 'reconciled',
    close: 'closed',
  };
  const nextStatus = statusByAction[input.action];
  if (!nextStatus) throw new Error('INVALID_TRANSITION');
  if (['mark_posting_failed', 'reverse'].includes(input.action) && !input.comment?.trim()) throw new Error('COMMENT_REQUIRED');
  const result = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe<Array<Record<string, unknown> & { status: string; version: number; reference: string }>>(
      `SELECT * FROM expense_accounting_entries WHERE id = $1::uuid FOR UPDATE`,
      input.id,
    );
    const row = rows[0];
    if (!row) throw new Error('NOT_FOUND');
    if (row.version !== input.expectedVersion) throw new Error('CONFLICT');
    if (['posted', 'reconciled', 'closed'].includes(row.status) && input.action !== 'reverse' && input.action !== 'reconcile' && input.action !== 'close') {
      throw new Error('INVALID_TRANSITION');
    }
    if (input.action === 'generate_journal') {
      const mappingRows = await tx.$queryRawUnsafe<Array<{ expense_account: string | null; payable_account: string | null }>>(
        `SELECT expense_account, payable_account FROM expense_accounting_mappings
         WHERE is_active = TRUE AND (company_id = $1::uuid OR company_id IS NULL)
           AND effective_from <= CURRENT_DATE AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
         ORDER BY (company_id IS NOT NULL) DESC LIMIT 1`,
        row.company_id || null,
      );
      const mapping = mappingRows[0];
      if (!mapping?.expense_account || !mapping?.payable_account) {
        await tx.$executeRawUnsafe(
          `UPDATE expense_accounting_entries
           SET status = 'validation_failed',
               validation_results = '[{"code":"MISSING_MAPPING","level":"blocked","message":"Expense and payable account mapping is required."}]'::jsonb,
               version = version + 1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1::uuid`,
          input.id,
        );
        await addActivity(tx, 'accounting', input.id, session.id, input.action, row.status, 'validation_failed', input.idempotencyKey, input.comment);
        return { status: 'validation_failed', version: row.version + 1 };
      }
      await tx.$executeRawUnsafe(`DELETE FROM expense_accounting_entry_lines WHERE entry_id = $1::uuid`, input.id);
      await tx.$executeRawUnsafe(
        `INSERT INTO expense_accounting_entry_lines
          (id, entry_id, line_number, account_code, description, debit, credit, currency, created_at)
         VALUES
          ($1::uuid, $2::uuid, 1, $3, 'Approved employee expense', $4, 0, $5, CURRENT_TIMESTAMP),
          ($6::uuid, $2::uuid, 2, $7, 'Employee reimbursement payable', 0, $4, $5, CURRENT_TIMESTAMP)`,
        randomUUID(), input.id, mapping.expense_account, row.total_debit, row.currency,
        randomUUID(), mapping.payable_account,
      );
    }
    if (input.action === 'reverse') {
      await tx.$executeRawUnsafe(
        `INSERT INTO expense_accounting_entries
          (id, reference, company_id, source_type, source_id, source_reference, journal_type,
           posting_date, document_date, accounting_period, currency, exchange_rate,
           total_debit, total_credit, status, validation_results, reversal_of_id, created_at, updated_at)
         SELECT $1::uuid, $2, company_id, 'reversal', id, reference, 'reversal',
                CURRENT_DATE, CURRENT_DATE, to_char(CURRENT_DATE, 'YYYY-MM'), currency, exchange_rate,
                total_credit, total_debit, 'ready_for_review', '[]'::jsonb, id,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM expense_accounting_entries WHERE id = $3::uuid`,
        randomUUID(), readableReference('REV'), input.id,
      );
    }
    await tx.$executeRawUnsafe(
      `UPDATE expense_accounting_entries
       SET status = $2, version = version + 1, updated_at = CURRENT_TIMESTAMP,
           external_posting_reference = COALESCE($3, external_posting_reference),
           posting_error = CASE WHEN $2 = 'posting_failed' THEN $4 ELSE posting_error END,
           exported_at = CASE WHEN $2 = 'exported' THEN CURRENT_TIMESTAMP ELSE exported_at END,
           posted_at = CASE WHEN $2 = 'posted' THEN CURRENT_TIMESTAMP ELSE posted_at END,
           reconciled_at = CASE WHEN $2 = 'reconciled' THEN CURRENT_TIMESTAMP ELSE reconciled_at END,
           reconciliation_notes = CASE WHEN $2 = 'reconciled' THEN $4 ELSE reconciliation_notes END
       WHERE id = $1::uuid`,
      input.id, nextStatus, input.externalReference || null, input.comment || null,
    );
    await addActivity(tx, 'accounting', input.id, session.id, input.action, row.status, nextStatus, input.idempotencyKey, input.comment);
    return { status: nextStatus, version: row.version + 1 };
  });
  await auditExpense(session.id, `Accounting ${input.action}`, 'AccountingEntry', input.id, result);
  return { id: input.id, ...result };
}

async function notifyApprover(
  userId: string | null,
  actorUserId: string,
  title: string,
  message: string,
  href: string,
) {
  if (!userId || userId === actorUserId) return;
  await NotificationService.createNotification(userId, {
    type: 'expense_workflow',
    title,
    message,
    data: { href },
  }, actorUserId).catch(() => null);
}

async function auditExpense(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown>,
) {
  await logAudit('AUDIT', action, `API:Expenses:${entity}`, userId, { entity, entityId, ...details });
}

export class ExpensePolicyError extends Error {
  readonly results: ExpensePolicyResult[];

  constructor(results: ExpensePolicyResult[]) {
    super('POLICY_BLOCKED');
    this.results = results;
  }
}
