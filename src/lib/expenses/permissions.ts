import type { PlatformModuleId } from '../types';
import { hasAnyPermission, isAdminUser, type SessionLikeUser } from '../permissions';

const financePermissions = ['EXPENSES_FINANCE', 'EXPENSES_ADMIN'] as PlatformModuleId[];
const approvalPermissions = ['EXPENSES_APPROVE', ...financePermissions] as PlatformModuleId[];
const auditPermissions = ['EXPENSES_AUDIT', ...financePermissions] as PlatformModuleId[];

export interface ExpenseAccess {
  isAdmin: boolean;
  canCreate: boolean;
  canApprove: boolean;
  canFinance: boolean;
  canAudit: boolean;
  readOnly: boolean;
}

export function getExpenseAccess(user: SessionLikeUser | null | undefined, hasEmployeeRecord: boolean): ExpenseAccess {
  const isAdmin = isAdminUser(user);
  const canFinance = isAdmin || hasAnyPermission(user, financePermissions);
  const canAudit = canFinance || hasAnyPermission(user, auditPermissions);
  const canApprove = canFinance || hasAnyPermission(user, approvalPermissions);
  const canCreate = hasEmployeeRecord && (
    isAdmin
    || hasAnyPermission(user, ['EXPENSES_VIEW'] as PlatformModuleId[])
    || Boolean(user)
  );
  return {
    isAdmin,
    canCreate,
    canApprove,
    canFinance,
    canAudit,
    readOnly: canAudit && !canFinance && !canApprove,
  };
}

export function maskPaymentDestination(value: string | null | undefined) {
  if (!value) return null;
  const visible = value.replace(/\s/g, '').slice(-4);
  return visible ? `Account ending ${visible}` : 'Payment destination on file';
}
