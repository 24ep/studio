import type { CreateHeadcountRequest } from "../../../lib/types";

export const headcountWithRelationsInclude = {
  position: {
    select: {
      id: true,
      title: true,
      department: true,
    },
  },
  applicant: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  attachments: {
    select: {
      id: true,
      fileName: true,
      label: true,
      filePath: true,
      uploadedAt: true,
    },
  },
} as const;

interface HeadcountCreator {
  id: string;
  name?: string | null;
  email?: string | null;
}

export function getCreateHeadcountValidationError(body: CreateHeadcountRequest) {
  if (!body.positionId || !body.type) {
    return "Position ID and type are required";
  }

  return null;
}

export function buildHeadcountCreateData(body: CreateHeadcountRequest, user: HeadcountCreator) {
  const {
    positionId,
    type,
    onboardingDate,
    requestDate,
    notes,
    memoId,
  } = body;

  return {
    positionId,
    type,
    status: 'pending',
    applicantId: null,
    onboardingDate: onboardingDate ? new Date(onboardingDate) : null,
    requestDate: requestDate ? new Date(requestDate) : null,
    notes: notes || null,
    memoId: memoId || null,
    employeeId: null,
    customFields: {
      ...(body.customFields || {}),
      requestedById: user.id,
      requestedByName: user.name || user.email || 'Unknown user',
      requestSource: 'position_headcount_management',
      approvalAction: null,
      approvalActionAt: null,
      approvalActionById: null,
      approvalActionByName: null,
      rejectionReason: null,
    },
  };
}
