import type { PlatformModuleId } from '@/lib/types';
import type { SessionLikeUser } from '@/lib/permissions';
import type { QueryResultRow } from 'pg';
import type { ApplicantUpdatePayload } from './applicant-detail-update-mutation';

interface ApplicantDetailUpdateQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

export interface ApplicantUpdatePermissionFlags {
  hasBasicEditPermission: boolean;
  hasSensitiveEditPermission: boolean;
  hasPipelineUpdatePermission: boolean;
}

export interface ApplicantUpdateRequestParts {
  updatePayload: ApplicantUpdatePayload;
  transitionNotes?: unknown;
  isRead?: unknown;
}

type ApplicantPermissionChecker = (
  user: SessionLikeUser | null | undefined,
  required: PlatformModuleId[]
) => boolean;

interface ApplicantUpdateReferenceValidationInput {
  client: ApplicantDetailUpdateQueryClient;
  positionId?: unknown;
  recruiterId?: unknown;
  sourceId?: unknown;
  status?: unknown;
}

export type ApplicantUpdateReferenceValidationResult =
  | { valid: true }
  | {
    valid: false;
    message: string;
    status: number;
    logMessage?: string;
    logError?: unknown;
  };

interface ApplicantRecruiterSyncInput {
  nextPositionId?: string | null;
  previousPositionId?: string | null;
  explicitRecruiterId?: string | null;
}

export function canAttemptApplicantUpdate({
  hasBasicEditPermission,
  hasSensitiveEditPermission,
  hasPipelineUpdatePermission,
}: ApplicantUpdatePermissionFlags) {
  return hasBasicEditPermission || hasSensitiveEditPermission || hasPipelineUpdatePermission;
}

export function buildApplicantUpdatePermissionFlags(
  user: SessionLikeUser | null | undefined,
  hasAnyPermission: ApplicantPermissionChecker
): ApplicantUpdatePermissionFlags {
  return {
    hasBasicEditPermission: hasAnyPermission(user, ['APPLICANTS_EDIT_BASIC', 'APPLICANTS_EDIT_BASIC_OWN']),
    hasSensitiveEditPermission: hasAnyPermission(user, ['APPLICANTS_EDIT_SENSITIVE', 'APPLICANTS_EDIT_SENSITIVE_OWN']),
    hasPipelineUpdatePermission: hasAnyPermission(user, ['APPLICANTS_PIPELINE_STAGE_UPDATE', 'APPLICANTS_PIPELINE_STAGE_UPDATE_OWN']),
  };
}

export function buildApplicantUpdateRequestParts(body: unknown): ApplicantUpdateRequestParts {
  const source = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const {
    name,
    email,
    phone,
    expectedSalary,
    positionId,
    recruiterId,
    fitScore,
    status,
    assignmentJustification,
    parsedData,
    custom_attributes,
    customFields,
    resumePath,
    transitionNotes,
    avatarUrl,
    sourceId,
    subSource,
    isPinned,
    isBlacklisted,
    isRead,
  } = source;

  return {
    updatePayload: {
      name,
      email,
      phone,
      expectedSalary,
      positionId,
      recruiterId,
      fitScore,
      status,
      assignmentJustification,
      parsedData,
      custom_attributes,
      customFields,
      resumePath,
      avatarUrl,
      sourceId,
      subSource,
      isPinned,
      isBlacklisted,
    },
    transitionNotes,
    isRead,
  };
}

export function shouldBroadcastApplicantStatusChange(previousStatus: unknown, nextStatus: unknown): nextStatus is string {
  return typeof nextStatus === 'string' && previousStatus !== nextStatus;
}

export function shouldSyncRecruiterAfterPositionChange({
  nextPositionId,
  previousPositionId,
  explicitRecruiterId,
}: ApplicantRecruiterSyncInput) {
  return nextPositionId !== undefined
    && nextPositionId !== previousPositionId
    && explicitRecruiterId === undefined;
}

export async function validateApplicantUpdateReferences({
  client,
  positionId,
  recruiterId,
  sourceId,
  status,
}: ApplicantUpdateReferenceValidationInput): Promise<ApplicantUpdateReferenceValidationResult> {
  if (positionId) {
    const positionCheck = await client.query('SELECT id FROM "Position" WHERE id = $1::uuid', [positionId]);
    if (positionCheck.rows.length === 0) {
      return {
        valid: false,
        status: 400,
        message: 'Position not found.',
        logMessage: `Position not found: ${positionId}`,
      };
    }
  }

  if (recruiterId) {
    const recruiterCheck = await client.query('SELECT id FROM "User" WHERE id = $1::uuid AND role = $2', [recruiterId, 'Recruiter']);
    if (recruiterCheck.rows.length === 0) {
      return {
        valid: false,
        status: 400,
        message: 'Recruiter not found or user is not a recruiter.',
        logMessage: `Recruiter not found or user is not a recruiter: ${recruiterId}`,
      };
    }
  }

  if (sourceId) {
    const sourceCheck = await client.query('SELECT id FROM "ApplicantSource" WHERE id = $1::uuid', [sourceId]);
    if (sourceCheck.rows.length === 0) {
      return {
        valid: false,
        status: 400,
        message: 'Applicant source not found.',
        logMessage: `Applicant source not found: ${sourceId}`,
      };
    }
  }

  if (status !== undefined) {
    try {
      const statusCheck = await client.query('SELECT id FROM "RecruitmentStage" WHERE id = $1::uuid', [status]);
      if (statusCheck.rows.length === 0) {
        return {
          valid: false,
          status: 400,
          message: 'Invalid status: Status must reference a valid recruitment stage',
        };
      }
    } catch (error) {
      return {
        valid: false,
        status: 500,
        message: 'Error validating status',
        logMessage: 'Error validating status:',
        logError: error,
      };
    }
  }

  return { valid: true };
}
