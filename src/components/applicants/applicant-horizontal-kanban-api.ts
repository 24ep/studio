import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import { getErrorMessage } from '@/lib/networkUtils';
import { getJsonArray, getJsonErrorMessage, getJsonString, isJsonObject, readJsonObject } from '@/lib/response-json';

export type ApplicantUpdateField = 'status' | 'recruiterId' | 'positionId';

function getRejectedApplicantMessage(value: unknown, applicantId: string) {
  if (!isJsonObject(value)) {
    return null;
  }

  const rejectedApplicant = getJsonArray(value, 'rejectedApplicants')
    ?.filter(isJsonObject)
    .find((candidate) => getJsonString(candidate, 'applicantId') === applicantId);

  return rejectedApplicant ? getJsonString(rejectedApplicant, 'message') : null;
}

export async function persistApplicantHorizontalKanbanFieldUpdate(
  applicant: Applicant,
  field: ApplicantUpdateField,
  value: string
) {
  try {
    if (field === 'status') {
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

      const rejectedApplicantMessage = getRejectedApplicantMessage(await readJsonObject(response), applicant.id);

      if (rejectedApplicantMessage) {
        throw new Error(`Headcount constraint: ${rejectedApplicantMessage}`);
      }

      toast.success(`Status updated to ${value}`, { id: applicant.id });
      return;
    }

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
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message, {
      id: applicant.id,
      duration: message.includes('Headcount constraint:') ? 8000 : undefined,
    });
  }
}
