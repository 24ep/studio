import prisma from '@/lib/prisma';
import { getHrModuleConfig, type HrModuleKey } from './hr-module-config';
import { getHrResourceConfig } from './hr-resource-registry';

export type HrWorkflowAction =
  | 'approve_leave'
  | 'reject_leave'
  | 'start_onboarding'
  | 'complete_onboarding'
  | 'complete_learning'
  | 'complete_review'
  | 'process_payroll'
  | 'publish_payslip'
  | 'mark_present'
  | 'mark_late';

export interface HrWorkflowDefinition {
  action: HrWorkflowAction;
  label: string;
  moduleKey: HrModuleKey;
  view?: string;
  status?: string;
}

export const HR_WORKFLOW_DEFINITIONS: HrWorkflowDefinition[] = [
  { action: 'start_onboarding', label: 'Start onboarding', moduleKey: 'onboarding', status: 'not_started' },
  { action: 'complete_onboarding', label: 'Complete onboarding', moduleKey: 'onboarding', status: 'in_progress' },
  { action: 'approve_leave', label: 'Approve', moduleKey: 'leave', status: 'pending' },
  { action: 'reject_leave', label: 'Reject', moduleKey: 'leave', status: 'pending' },
  { action: 'mark_present', label: 'Mark present', moduleKey: 'attendance', status: 'late' },
  { action: 'mark_late', label: 'Mark late', moduleKey: 'attendance', status: 'present' },
  { action: 'complete_review', label: 'Complete review', moduleKey: 'performance', status: 'in_progress' },
  { action: 'complete_learning', label: 'Complete learning', moduleKey: 'learning', status: 'in_progress' },
  { action: 'process_payroll', label: 'Process run', moduleKey: 'payroll-runs', view: 'runs', status: 'draft' },
  { action: 'publish_payslip', label: 'Publish', moduleKey: 'payslips', view: 'payslips', status: 'draft' },
];

export function getHrWorkflowDefinition(action: string) {
  return HR_WORKFLOW_DEFINITIONS.find(definition => definition.action === action);
}

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteTable(identifier: string) {
  return identifier.split('.').map(quoteIdent).join('.');
}

export async function executeHrWorkflowAction({
  action,
  id,
  actingUserId,
}: {
  action: HrWorkflowAction;
  id: string;
  actingUserId: string;
}) {
  const definition = getHrWorkflowDefinition(action);
  if (!definition) throw new Error('Unsupported HR workflow action.');

  const moduleConfig = getHrModuleConfig(definition.moduleKey);
  const resourceConfig = getHrResourceConfig(definition.moduleKey, definition.view);
  const table = quoteTable(resourceConfig.table);

  if (action === 'approve_leave') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'approved', "approver_id" = $2::uuid, "decided_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" = 'pending' RETURNING *`,
      id,
      actingUserId,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'reject_leave') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'rejected', "approver_id" = $2::uuid, "decided_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" = 'pending' RETURNING *`,
      id,
      actingUserId,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'start_onboarding') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'in_progress', "progress" = GREATEST("progress", 10), "start_date" = COALESCE("start_date", CURRENT_TIMESTAMP), "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" = 'not_started' RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'complete_onboarding') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'completed', "progress" = 100, "completed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" IN ('not_started', 'in_progress') RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'complete_learning') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'completed', "progress" = 100, "completed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" IN ('assigned', 'in_progress') RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'complete_review') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'completed', "completed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" IN ('not_started', 'in_progress') RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'process_payroll') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'processed', "processed_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" = 'draft' RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  if (action === 'publish_payslip') {
    return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${table} SET "status" = 'published', "published_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid AND "status" = 'draft' RETURNING *`,
      id,
    ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
  }

  const status = action === 'mark_present' ? 'present' : 'late';
  return prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE ${table} SET "status" = $2, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid RETURNING *`,
    id,
    status,
  ).then(rows => ({ definition, moduleConfig, row: rows[0] || null }));
}
