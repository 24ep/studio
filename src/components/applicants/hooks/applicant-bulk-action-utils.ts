import {
  getJsonArray,
  getJsonNumber,
  getJsonString,
  isJsonObject,
} from '@/lib/response-json';
import { postApplicantBulkAction } from './applicant-action-utils';

export interface BulkRecruiterOption {
  id: string;
  name: string;
}

export async function bulkDeleteApplicants(applicantIds: string[]) {
  return postApplicantBulkAction({
    action: 'delete',
    applicantIds,
  }, 'Bulk delete failed');
}

export async function bulkChangeApplicantStatus(
  applicantIds: string[],
  newStatus: string,
  notes?: string,
) {
  return postApplicantBulkAction({
    action: 'change_status',
    applicantIds,
    newStatus,
    transitionNotes: notes,
  }, 'Bulk status change failed');
}

export async function bulkAssignApplicantRecruiter(
  applicantIds: string[],
  recruiterId: string | null,
) {
  return postApplicantBulkAction({
    action: 'assign_recruiter',
    applicantIds,
    newRecruiterId: recruiterId,
  }, 'Bulk recruiter assignment failed');
}

export async function bulkReprocessApplicants(applicantIds: string[]) {
  return postApplicantBulkAction({
    action: 'reprocess',
    applicantIds,
  }, 'Bulk re-process failed');
}

export function getBulkActionCount(result: unknown, key: string, fallback = 0) {
  return isJsonObject(result) ? getJsonNumber(result, key) ?? fallback : fallback;
}

export function getBulkActionArrayCount(result: unknown, key: string) {
  return isJsonObject(result) ? getJsonArray(result, key)?.length ?? 0 : 0;
}

export function getBulkRecruiterName(
  recruiters: BulkRecruiterOption[],
  recruiterId: string | null,
) {
  if (!Array.isArray(recruiters)) {
    return 'No Recruiter';
  }

  return recruiters.find(recruiter => recruiter.id === recruiterId)?.name || 'No Recruiter';
}

export function getBulkReprocessErrorMessages(result: unknown) {
  if (!isJsonObject(result)) {
    return [];
  }

  return (getJsonArray(result, 'reprocessErrors') ?? []).flatMap((entry) => {
    if (!isJsonObject(entry)) {
      return [];
    }

    const applicantName = getJsonString(entry, 'ApplicantName') ?? 'Applicant';
    const errorMessage = getJsonString(entry, 'error') ?? 'Unknown error';
    return [`${applicantName}: ${errorMessage}`];
  });
}
