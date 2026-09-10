import type { Dispatch, SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';

type ApplicantToggleField = 'isPinned' | 'isBlacklisted' | 'isRead';

interface ApplicantToggleConfig {
  field: ApplicantToggleField;
  errorMessage: string;
  getSuccessMessage: (value: boolean) => string;
}

interface UseApplicantDetailToggleActionsInput {
  applicant: Applicant | null;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

const APPLICANT_TOGGLE_CONFIGS = {
  pin: {
    field: 'isPinned',
    errorMessage: 'Failed to update applicant pin status',
    getSuccessMessage: (value: boolean) => value
      ? 'Applicant pinned successfully'
      : 'Applicant unpinned successfully',
  },
  blacklist: {
    field: 'isBlacklisted',
    errorMessage: 'Failed to update applicant blacklist status',
    getSuccessMessage: (value: boolean) => value
      ? 'Applicant added to blacklist'
      : 'Applicant removed from blacklist',
  },
  read: {
    field: 'isRead',
    errorMessage: 'Failed to update applicant read status',
    getSuccessMessage: (value: boolean) => value ? 'Marked as read' : 'Marked as unread',
  },
} satisfies Record<string, ApplicantToggleConfig>;

export function useApplicantDetailToggleActions({
  applicant,
  setApplicant,
  toastSuccess,
  toastError,
}: UseApplicantDetailToggleActionsInput) {
  const toggleApplicantField = async (config: ApplicantToggleConfig) => {
    if (!applicant?.id) return;

    const nextValue = !applicant[config.field];

    try {
      const response = await fetch(`/api/applicants/${applicant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [config.field]: nextValue }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), config.errorMessage));
      }

      const updatedApplicant = await readJsonObject(response);
      const updatedValue = Boolean(updatedApplicant[config.field]);

      setApplicant(prev => prev ? { ...prev, [config.field]: updatedValue } : prev);
      toastSuccess(config.getSuccessMessage(updatedValue));
    } catch (error) {
      console.error(`[useApplicantDetailToggleActions] ${config.errorMessage}:`, error);
      const errorMessage = error instanceof Error ? error.message : config.errorMessage;
      toastError(errorMessage);
    }
  };

  return {
    handleTogglePin: () => toggleApplicantField(APPLICANT_TOGGLE_CONFIGS.pin),
    handleToggleBlacklist: () => toggleApplicantField(APPLICANT_TOGGLE_CONFIGS.blacklist),
    handleToggleRead: () => toggleApplicantField(APPLICANT_TOGGLE_CONFIGS.read),
  };
}
