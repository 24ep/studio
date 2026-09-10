import type { Prisma } from '@prisma/client';
import type { HeadcountApprovalRoute } from '@/lib/headcount-approval-path-config';

export type HeadcountRequestStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'filled';
export type HeadcountRequestAction = 'submit' | 'approve' | 'reject';

export interface HeadcountRequestCreateInput {
  positionId?: unknown;
  type?: unknown;
  requestDate?: unknown;
  onboardingDate?: unknown;
  memoId?: unknown;
  notes?: unknown;
  priority?: unknown;
  businessJustification?: unknown;
  roleCount?: unknown;
  annualCost?: unknown;
  requesterTitle?: unknown;
  approvalRoute?: unknown;
  submissionStatus?: unknown;
}

export interface HeadcountRequestActionInput {
  id?: unknown;
  action?: unknown;
  reason?: unknown;
}

const VALID_TYPES = new Set(['new', 'replace', 'promote']);

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value: unknown) {
  const text = getString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function getHeadcountRequestStatus(status: string | null | undefined): HeadcountRequestStatus {
  if (status === 'draft') return 'draft';
  if (status === 'filled') return 'filled';
  if (status === 'rejected') return 'rejected';
  if (status === 'vacant') return 'approved';
  return 'in_review';
}

export function getHeadcountRequestValidationError(input: HeadcountRequestCreateInput) {
  const positionId = getString(input.positionId);
  const type = getString(input.type) || 'new';

  if (!positionId) return 'Position is required';
  if (!VALID_TYPES.has(type)) return 'Headcount type is invalid';
  const roleCount = Number(input.roleCount ?? 1);
  const annualCost = Number(input.annualCost ?? 0);
  if (!Number.isInteger(roleCount) || roleCount < 1) return 'Role count must be at least 1';
  if (!Number.isFinite(annualCost) || annualCost < 0) return 'Annual budget must be zero or greater';
  if (input.approvalRoute && getString(input.approvalRoute).length > 80) return 'Approval route is invalid';

  return null;
}

export function getHeadcountRequestActionValidationError(input: HeadcountRequestActionInput) {
  const id = getString(input.id);
  const action = getString(input.action);
  const reason = getString(input.reason);

  if (!id) return 'Request ID is required';
  if (action !== 'submit' && action !== 'approve' && action !== 'reject') return 'Request action is invalid';
  if (action === 'reject' && !reason) return 'Rejection reason is required';

  return null;
}

export function getHeadcountRequestActionStatus(action: HeadcountRequestAction) {
  if (action === 'submit') return 'in_review';
  return action === 'approve' ? 'vacant' : 'rejected';
}

export function getHeadcountRequestActionTransitionError(status: string, action: HeadcountRequestAction) {
  if (status === 'filled') return 'Filled headcount requests cannot be changed.';
  if (action === 'submit' && status !== 'draft') return 'Only draft requests can be submitted for review.';
  if (action !== 'submit' && status === 'draft') return 'Submit the draft for review before making a decision.';
  return null;
}

export function mergeHeadcountRequestActionFields(
  customFields: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
  input: HeadcountRequestActionInput,
  user: { id: string; name?: string | null; email?: string | null },
): Prisma.InputJsonValue {
  const previousFields = customFields && typeof customFields === 'object' && !Array.isArray(customFields)
    ? customFields as Record<string, unknown>
    : {};
  const action = getString(input.action) as HeadcountRequestAction;
  const actorName = user.name || user.email || 'Unknown user';
  const previousPath = Array.isArray(previousFields.approvalPath) ? previousFields.approvalPath : [];
  const completedPath = previousPath.map(step => (
    step && typeof step === 'object' && !Array.isArray(step)
      ? { ...step, status: 'complete' }
      : step
  ));

  if (action === 'submit') {
    return {
      ...previousFields,
      submittedAt: new Date().toISOString(),
      submittedById: user.id,
      submittedByName: actorName,
      approvalAction: null,
      approvalActionAt: null,
      approvalActionById: null,
      approvalActionByName: null,
      rejectionReason: null,
    };
  }

  return {
    ...previousFields,
    approvalAction: action,
    approvalActionAt: new Date().toISOString(),
    approvalActionById: user.id,
    approvalActionByName: actorName,
    rejectionReason: action === 'reject' ? getString(input.reason) : null,
    approvalPath: completedPath,
  };
}

export function buildHeadcountRequestCreateData(
  input: HeadcountRequestCreateInput,
  user: { id: string; name?: string | null; email?: string | null },
  configuredRoute?: HeadcountApprovalRoute | null,
): Prisma.HeadcountUncheckedCreateInput {
  const requestDate = normalizeDate(input.requestDate) || new Date();
  const onboardingDate = normalizeDate(input.onboardingDate);
  const priority = getString(input.priority) || 'normal';
  const businessJustification = getString(input.businessJustification);
  const roleCount = Number(input.roleCount ?? 1);
  const annualCost = Number(input.annualCost ?? 0);
  const requesterName = user.name || user.email || 'Unknown user';
  const requesterTitle = getString(input.requesterTitle) || 'Request owner';
  const approvalRoute = configuredRoute?.id || getString(input.approvalRoute) || 'standard';
  const approvalPath = buildApprovalPath(approvalRoute, requesterName, requesterTitle, configuredRoute);

  return {
    positionId: getString(input.positionId),
    type: getString(input.type) || 'new',
    status: getString(input.submissionStatus) === 'draft' ? 'draft' : 'in_review',
    requestDate,
    onboardingDate,
    notes: getString(input.notes) || null,
    memoId: getString(input.memoId) || null,
    customFields: {
      requestedById: user.id,
      requestedByName: requesterName,
      requesterTitle,
      priority,
      businessJustification,
      roleCount,
      annualCost,
      currency: 'THB',
      approvalRoute,
      approvalPath,
      requestSource: 'hiring_headcount_request',
    },
  };
}

function buildApprovalPath(
  route: string,
  requesterName: string,
  requesterTitle: string,
  configuredRoute?: HeadcountApprovalRoute | null,
) {
  const requester = { role: 'Requester', name: requesterName, title: requesterTitle, status: 'complete' };
  if (configuredRoute) {
    return [
      requester,
      ...configuredRoute.steps.map((step, index) => ({
        role: step.role,
        name: `${step.role} approver`,
        title: step.title,
        status: index === 0 ? 'in_review' : 'pending',
      })),
    ];
  }
  const department = { role: 'Department lead', name: 'Department lead', title: 'Business approval', status: 'in_review' };
  const finance = { role: 'Finance', name: 'Finance approver', title: 'Budget approval', status: 'pending' };
  const hr = { role: 'HR', name: 'HR approver', title: 'Workforce approval', status: 'pending' };
  const executive = { role: 'Executive', name: 'Executive approver', title: 'Executive approval', status: 'pending' };

  if (route === 'lean') return [requester, department, hr];
  if (route === 'executive') return [requester, department, finance, executive, hr];
  return [requester, department, finance, hr];
}
