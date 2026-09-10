import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import { getErrorMessage } from '@/lib/networkUtils';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';
import { getApplicantKanbanFieldValue } from '../applicant-kanban-layout-utils';

export interface ApplicantKanbanDropTarget {
  field: string;
  value: string;
}

interface ApplicantKanbanDropTargetInput {
  applicant: Applicant;
  columnField: string;
  colValue: string;
  isColumnBased: boolean;
  isRowBased: boolean;
  rowField: string;
  rowValue: string;
}

interface RejectedApplicantResult {
  applicantId?: string;
  message?: string;
}

export function getApplicantKanbanDropTarget({
  applicant,
  columnField,
  colValue,
  isColumnBased,
  isRowBased,
  rowField,
  rowValue,
}: ApplicantKanbanDropTargetInput): ApplicantKanbanDropTarget | null {
  if (isColumnBased && !isRowBased) {
    return getApplicantKanbanFieldValue(applicant, columnField) === colValue
      ? null
      : { field: columnField, value: colValue };
  }

  if (isRowBased && !isColumnBased) {
    return getApplicantKanbanFieldValue(applicant, rowField) === rowValue
      ? null
      : { field: rowField, value: rowValue };
  }

  if (isRowBased && isColumnBased) {
    const rowChanged = getApplicantKanbanFieldValue(applicant, rowField) !== rowValue;
    const columnChanged = getApplicantKanbanFieldValue(applicant, columnField) !== colValue;

    return rowChanged || columnChanged
      ? { field: rowField, value: rowValue }
      : null;
  }

  return null;
}

export async function persistApplicantKanbanFieldUpdate(
  applicant: Applicant,
  field: string,
  value: unknown
): Promise<void> {
  try {
    if (field === 'status') {
      await persistApplicantStatusUpdate(applicant, value);
      return;
    }

    if (field === 'recruiterId' || field === 'positionId') {
      await persistApplicantDirectFieldUpdate(applicant, field, value);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message, {
      id: applicant.id,
      duration: message.includes('Headcount constraint:') ? 8000 : undefined,
    });
  }
}

async function persistApplicantStatusUpdate(applicant: Applicant, value: unknown): Promise<void> {
  toast.loading('Updating Applicant status...', { id: applicant.id });
  const response = await fetch('/api/applicants/bulk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'change_status',
      applicantIds: [applicant.id],
      newStatus: value,
    }),
  });

  if (!response.ok) {
    const data = await readJsonObject(response);
    if (response.status === 403) {
      throw new Error('Permission denied: You do not have permission to update Applicant status. Please contact your administrator.');
    }
    throw new Error(getJsonErrorMessage(data, `Failed to update Applicant status: HTTP ${response.status}`));
  }

  const result = await readJsonObject(response);
  const rejectedApplicant = findRejectedApplicant(result.rejectedApplicants, applicant.id);
  if (rejectedApplicant) {
    throw new Error(`Headcount constraint: ${rejectedApplicant.message}`);
  }

  toast.success(`Status updated to ${value}`, { id: applicant.id });
}

async function persistApplicantDirectFieldUpdate(
  applicant: Applicant,
  field: 'recruiterId' | 'positionId',
  value: unknown
): Promise<void> {
  toast.loading('Updating Applicant...', { id: applicant.id });
  const response = await fetch(`/api/applicants/${applicant.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    const data = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(data, 'Failed to update Applicant'));
  }

  toast.success('Applicant updated', { id: applicant.id });
}

function findRejectedApplicant(
  rejectedApplicants: unknown,
  applicantId: string
): RejectedApplicantResult | null {
  if (!Array.isArray(rejectedApplicants)) {
    return null;
  }

  const rejectedApplicant = rejectedApplicants.find((candidate): candidate is RejectedApplicantResult => (
    typeof candidate === 'object' &&
    candidate !== null &&
    'applicantId' in candidate &&
    candidate.applicantId === applicantId
  ));

  return rejectedApplicant ?? null;
}
