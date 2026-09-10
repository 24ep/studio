import type { CustomFieldValues, HeadcountStatus, HeadcountType } from '@/lib/types';

export interface HeadcountModalSaveData {
  type: HeadcountType;
  status: HeadcountStatus;
  applicantId: string | null;
  onboardingDate: string;
  requestDate: string;
  notes: string;
  memoId: string;
  employeeId: string;
  customFields: CustomFieldValues;
}
