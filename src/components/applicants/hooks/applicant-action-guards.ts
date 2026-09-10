import { toast } from 'react-hot-toast';
import type { Applicant } from '../../../lib/types';
import {
  fetchOriginalApplicant,
  isApplicantAiSearchLocked,
} from './applicant-action-utils';

export async function prepareApplicantAction(
  applicantId: string,
  aiMatchedApplicantIds: string[] | null
): Promise<Applicant | null> {
  if (isApplicantAiSearchLocked(aiMatchedApplicantIds)) {
    toast('AI Search Active: Please clear AI search to perform updates.');
    return null;
  }

  const originalApplicant = await fetchOriginalApplicant(applicantId);
  if (!originalApplicant) {
    toast.error('Applicant not found');
    return null;
  }

  return originalApplicant;
}
