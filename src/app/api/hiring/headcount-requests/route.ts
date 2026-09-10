import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import { runHeadcountCreationEffects } from '@/app/api/headcount/headcount-route-utils';
import {
  buildHeadcountRequestCreateData,
  getHeadcountRequestActionStatus,
  getHeadcountRequestActionTransitionError,
  getHeadcountRequestActionValidationError,
  getHeadcountRequestStatus,
  getHeadcountRequestValidationError,
  mergeHeadcountRequestActionFields,
  type HeadcountRequestAction,
  type HeadcountRequestActionInput,
  type HeadcountRequestCreateInput,
} from './headcount-request-utils';
import {
  assertPositionHeadcountCapacity,
  HeadcountAllocationError,
} from '@/lib/hr/organization-headcount-allocation';
import { getHeadcountApprovalRoute } from '@/lib/headcount-approval-path-config';

export const dynamic = 'force-dynamic';

const headcountRequestInclude = {
  position: {
    select: {
      id: true,
      title: true,
      department: true,
      isOpen: true,
      positionLevel: true,
      organizationUnitId: true,
    },
  },
} as const;

type HeadcountRequestRow = Prisma.HeadcountGetPayload<{
  include: typeof headcountRequestInclude;
}>;

function canViewHeadcountRequests(user: Parameters<typeof hasPermission>[0]) {
  return hasPermission(user, 'POSITIONS_VIEW');
}

function canCreateHeadcountRequests(user: Parameters<typeof hasPermission>[0]) {
  return hasPermission(user, 'POSITIONS_EDIT_BASIC') || hasPermission(user, 'POSITIONS_CREATE');
}

type OrganizationUnitSummary = {
  name: string;
  division: string;
  department: string;
  section: string;
  unitType: string;
};

async function loadOrganizationUnitMap(rows: HeadcountRequestRow[]) {
  const ids = Array.from(new Set(rows.map(row => row.position.organizationUnitId).filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return new Map<string, OrganizationUnitSummary>();
  const units = await prisma.department.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, division: true, department: true, section: true, unitType: true },
  });
  return new Map(units.map(unit => [unit.id, unit]));
}

function mapHeadcountRequest(row: HeadcountRequestRow, organizationUnits = new Map<string, OrganizationUnitSummary>()) {
  const customFields = row.customFields && typeof row.customFields === 'object' && !Array.isArray(row.customFields)
    ? row.customFields as Record<string, unknown>
    : {};

  return {
    id: row.id,
    ticketNo: `HC-${row.createdAt.getFullYear()}-${row.id.slice(0, 8).toUpperCase()}`,
    type: row.type,
    status: getHeadcountRequestStatus(row.status),
    rawStatus: row.status,
    requestDate: row.requestDate?.toISOString() ?? row.createdAt.toISOString(),
    onboardingDate: row.onboardingDate?.toISOString() ?? null,
    memoId: row.memoId,
    notes: row.notes,
    priority: typeof customFields.priority === 'string' ? customFields.priority : 'normal',
    businessJustification: typeof customFields.businessJustification === 'string' ? customFields.businessJustification : '',
    rejectionReason: typeof customFields.rejectionReason === 'string' ? customFields.rejectionReason : null,
    approvalAction: customFields.approvalAction === 'approve' || customFields.approvalAction === 'reject'
      ? customFields.approvalAction
      : null,
    approvalActionByName: typeof customFields.approvalActionByName === 'string' ? customFields.approvalActionByName : null,
    approvalActionAt: typeof customFields.approvalActionAt === 'string' ? customFields.approvalActionAt : null,
    requestedByName: typeof customFields.requestedByName === 'string' ? customFields.requestedByName : null,
    requesterTitle: typeof customFields.requesterTitle === 'string' ? customFields.requesterTitle : null,
    roleCount: typeof customFields.roleCount === 'number' ? customFields.roleCount : 1,
    annualCost: typeof customFields.annualCost === 'number' ? customFields.annualCost : 0,
    currency: typeof customFields.currency === 'string' ? customFields.currency : 'THB',
    approvalPath: Array.isArray(customFields.approvalPath) ? customFields.approvalPath : [],
    position: {
      ...row.position,
      organizationUnit: row.position.organizationUnitId
        ? organizationUnits.get(row.position.organizationUnitId) || null
        : null,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const findManyArgs = {
  include: headcountRequestInclude,
  orderBy: [
    { requestDate: 'desc' as const },
    { createdAt: 'desc' as const },
  ],
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canViewHeadcountRequests(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const requests = await prisma.headcount.findMany(findManyArgs);
  const organizationUnits = await loadOrganizationUnitMap(requests);
  const data = requests.map(row => mapHeadcountRequest(row, organizationUnits));

  return NextResponse.json({
    data,
    metrics: {
      total: data.length,
      draft: data.filter(item => item.status === 'draft').length,
      inReview: data.filter(item => item.status === 'in_review').length,
      approved: data.filter(item => item.status === 'approved').length,
      filled: data.filter(item => item.status === 'filled').length,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateHeadcountRequests(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const input = bodyResult.value as HeadcountRequestCreateInput;
  const validationError = getHeadcountRequestValidationError(input);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const position = await prisma.position.findUnique({
    where: { id: String(input.positionId) },
    select: { id: true },
  });

  if (!position) {
    return NextResponse.json({ message: 'Position not found' }, { status: 404 });
  }

  const configuredApprovalRoute = await getHeadcountApprovalRoute(String(input.approvalRoute || ''));
  if (!configuredApprovalRoute) {
    return NextResponse.json({ message: 'No active headcount approval path is configured.' }, { status: 400 });
  }

  let created: HeadcountRequestRow;
  try {
    created = await prisma.$transaction(async tx => {
      if (input.submissionStatus !== 'draft') {
        await assertPositionHeadcountCapacity(tx, position.id, 1);
      }
      return tx.headcount.create({
        data: buildHeadcountRequestCreateData(input, session.user, configuredApprovalRoute),
        include: headcountRequestInclude,
      });
    });
  } catch (error) {
    return allocationErrorResponse(error);
  }

  const organizationUnits = await loadOrganizationUnitMap([created]);
  return NextResponse.json({ data: mapHeadcountRequest(created, organizationUnits) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateHeadcountRequests(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const input = bodyResult.value as HeadcountRequestActionInput;
  const validationError = getHeadcountRequestActionValidationError(input);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const existing = await prisma.headcount.findUnique({
    where: { id: String(input.id) },
    include: headcountRequestInclude,
  });

  if (!existing) {
    return NextResponse.json({ message: 'Headcount request not found' }, { status: 404 });
  }

  const action = String(input.action) as HeadcountRequestAction;
  const transitionError = getHeadcountRequestActionTransitionError(existing.status, action);
  if (transitionError) {
    return NextResponse.json({ message: transitionError }, { status: 400 });
  }
  let updated: HeadcountRequestRow;
  try {
    updated = await prisma.$transaction(async tx => {
      if (action === 'submit') {
        await assertPositionHeadcountCapacity(tx, existing.positionId, 1);
      } else if (action === 'approve') {
        await assertPositionHeadcountCapacity(tx, existing.positionId, existing.status === 'rejected' ? 1 : 0);
      }
      return tx.headcount.update({
        where: { id: existing.id },
        data: {
          status: getHeadcountRequestActionStatus(action),
          customFields: mergeHeadcountRequestActionFields(existing.customFields, input, session.user),
        },
        include: headcountRequestInclude,
      });
    });
  } catch (error) {
    return allocationErrorResponse(error);
  }

  if (action === 'approve') {
    await runHeadcountCreationEffects(updated.positionId, session.user);
  }

  const organizationUnits = await loadOrganizationUnitMap([updated]);
  return NextResponse.json({ data: mapHeadcountRequest(updated, organizationUnits) });
}

function allocationErrorResponse(error: unknown) {
  if (error instanceof HeadcountAllocationError) {
    return NextResponse.json({
      message: error.message,
      code: error.code,
      allocation: error.details,
    }, { status: 409 });
  }
  if (error instanceof Error && (
    error.message.includes('organization assignment')
    || error.message.includes('organization unit is inactive')
    || error.message.includes('organization path contains an inactive')
  )) {
    return NextResponse.json({ message: error.message, code: 'POSITION_ORGANIZATION_INVALID' }, { status: 400 });
  }
  console.error('[HeadcountRequests] Allocation validation failed:', error);
  return NextResponse.json({ message: 'Unable to validate headcount allocation.' }, { status: 500 });
}
