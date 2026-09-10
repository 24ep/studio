import type { Applicant, Position, User } from './types';
import type { CustomFieldValues } from './custom-field-types';

export type HeadcountType = 'promote' | 'new' | 'replace';
export type HeadcountStatus = 'pending' | 'vacant' | 'filled' | 'rejected';

export interface Headcount {
  id: string;
  positionId: string;
  type: HeadcountType;
  status: HeadcountStatus;
  applicantId?: string | null;
  onboardingDate?: string | null;
  requestDate?: string | null;
  notes?: string | null;
  memoId?: string | null;
  customFields?: CustomFieldValues;
  employeeId?: string | null;
  createdAt: string;
  updatedAt: string;
  position?: Position;
  applicant?: Applicant;
  attachments?: Attachment[];
}

export interface CreateHeadcountRequest {
  positionId: string;
  type: HeadcountType;
  status?: HeadcountStatus;
  applicantId?: string | null;
  onboardingDate?: string | null;
  requestDate?: string | null;
  notes?: string | null;
  memoId?: string | null;
  customFields?: CustomFieldValues;
  employeeId?: string | null;
}

export interface UpdateHeadcountRequest {
  type?: HeadcountType;
  status?: HeadcountStatus;
  applicantId?: string | null;
  onboardingDate?: string | null;
  requestDate?: string | null;
  notes?: string | null;
  memoId?: string | null;
  customFields?: CustomFieldValues;
  employeeId?: string | null;
}

export interface Attachment {
  id: string;
  applicantId?: string | null;
  headcountId?: string | null;
  uploadedById: string;
  filePath: string;
  fileName: string;
  label: string;
  isPrimary: boolean;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy?: User;
}
