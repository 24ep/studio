import type React from 'react';
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import type { Applicant, CustomFieldValue, Position } from '@/lib/types';
import type { ApplicantAttachment } from './applicant-attachment-utils';
import type { ApplicantJobMatchLike } from './full-applicant-detail-utils';
import type { EditApplicantFormValues } from './hooks/use-applicant-detail-edit-form';

export type ApplicantFormArrayField = {
  id?: string;
  field_id?: string;
} & Record<string, unknown>;

export type AppendApplicantFormArrayItem = (value: unknown) => void;

export interface ApplicantTabsContentProps {
  activeTab: string;
  applicant: Applicant;
  allDbPositions: Position[];
  isEditing: boolean;
  applicantJobMatches: ApplicantJobMatchLike[];
  onJobMatchClick: (jobMatch: ApplicantJobMatchLike) => void;
  onCopyJobMatch: (match: ApplicantJobMatchLike, index: number) => void;
  copiedJobMatchIndex: number | null;
  onCopyJobApplied: () => void;
  copiedJobApplied: boolean;
  appliedJobId: string | null;
  appliedFitScore: number | null;
  appliedJustification: string[];
  appliedJobBadge: React.ReactNode;
  onOpenPositionDrawer: (positionId: string) => void;
  register?: UseFormRegister<EditApplicantFormValues>;
  errors?: FieldErrors<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  control?: Control<EditApplicantFormValues>;
  educationFields?: ApplicantFormArrayField[];
  appendEducation?: AppendApplicantFormArrayItem;
  removeEducation?: (index: number) => void;
  experienceFields?: ApplicantFormArrayField[];
  appendExperience?: AppendApplicantFormArrayItem;
  removeExperience?: (index: number) => void;
  skillsFields?: ApplicantFormArrayField[];
  appendSkill?: AppendApplicantFormArrayItem;
  removeSkill?: (index: number) => void;
  jobSuitableFields?: ApplicantFormArrayField[];
  appendJobSuitable?: AppendApplicantFormArrayItem;
  removeJobSuitable?: (index: number) => void;
  jobMatchesFields?: ApplicantFormArrayField[];
  appendJobMatch?: AppendApplicantFormArrayItem;
  removeJobMatch?: (index: number) => void;
  calculateTotalExperienceDuration?: (experience: unknown[]) => string;
  comments?: unknown[];
  resumes?: ApplicantAttachment[];
  onRefresh?: () => void;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
  customFieldsRefreshTrigger?: number;
}
