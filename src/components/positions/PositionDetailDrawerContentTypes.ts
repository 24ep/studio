import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  Applicant,
  ApplicantFilterValues,
  ApplicantSource,
  CustomFieldValue,
  Grade,
  Position,
  RecruitmentStage,
  UserProfile,
} from '@/lib/types';
import type { EditPositionFormValues } from './position-edit-form';
import type { AzureAdPositionUser } from './PositionMicrosoftAdTab';
import type { PositionDetailTabId } from './PositionDetailTabsNav';

export interface PositionDetailDrawerContentProps {
  activeTab: PositionDetailTabId;
  activeApplicantTab: string;
  position: Position | null;
  positionId: string | null;
  isMobile: boolean;
  isJobMatchEnabled: boolean;
  isEditMode: boolean;
  isSaving: boolean;
  isDrawerReady: boolean;
  isLoadingLevels: boolean;
  isGeneratingDescription: boolean;
  positionLevels: Array<{ id: string; name: string; color?: string }>;
  grades: Grade[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  recruitmentStages: RecruitmentStage[];
  form: UseFormReturn<EditPositionFormValues>;
  defaultMatchCriteria: string;
  headcountsTotal: number;
  allApplicantsTotal: number;
  appliedApplicantsTotal: number;
  appliedApplicantsCount: number;
  appliedApplicants: Applicant[];
  sortedAppliedApplicants: Applicant[];
  appliedApplicantsSearchTerm: string;
  appliedApplicantsSortColumn: string | null;
  appliedApplicantsSortDirection: 'asc' | 'desc';
  appliedApplicantsOpenMenu: string | null;
  appliedApplicantsPage: number;
  appliedApplicantsPageSize: number;
  potentialApplicants: Applicant[];
  sortedPotentialApplicants: Applicant[];
  potentialApplicantsSearchTerm: string;
  potentialApplicantsSortColumn: string | null;
  potentialApplicantsSortDirection: 'asc' | 'desc';
  potentialApplicantsOpenMenu: string | null;
  potentialApplicantsPage: number;
  potentialApplicantsPageSize: number;
  potentialApplicantsTotal: number;
  filteredApplicants: Applicant[];
  applicantFilters: ApplicantFilterValues;
  isAiSearchingApplicants: boolean;
  stageNames: Record<string, string>;
  adUsers: AzureAdPositionUser[];
  adUsersError: string | null;
  isLoadingAdUsers: boolean;
  onTabChange: Dispatch<SetStateAction<PositionDetailTabId>>;
  onActiveApplicantTabChange: (tab: 'applied' | 'potential') => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: EditPositionFormValues) => Promise<void>;
  onGenerateJobDescription: () => void | Promise<void>;
  onUseDefaultCriteria: () => void;
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
  onHeadcountChange: () => void;
  onAppliedApplicantsSearchChange: Dispatch<SetStateAction<string>>;
  onAppliedApplicantsSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onAppliedApplicantsOpenMenuChange: Dispatch<SetStateAction<string | null>>;
  onAppliedApplicantsPageChange: Dispatch<SetStateAction<number>>;
  onAppliedApplicantsPageSizeChange: Dispatch<SetStateAction<number>>;
  onAppliedApplicantPinToggle: (applicant: Applicant) => Promise<void>;
  onPotentialApplicantsSearchChange: Dispatch<SetStateAction<string>>;
  onPotentialApplicantsSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onPotentialApplicantsOpenMenuChange: Dispatch<SetStateAction<string | null>>;
  onPotentialApplicantsPageChange: Dispatch<SetStateAction<number>>;
  onPotentialApplicantsPageSizeChange: Dispatch<SetStateAction<number>>;
  onPotentialApplicantPinToggle: (applicant: Applicant) => Promise<void>;
  onApplicantClick: (applicantId: string) => void;
  onApplicantFilterChange: Dispatch<SetStateAction<ApplicantFilterValues>>;
  onAiSearch: (query: string) => void;
  onClearFilters: () => void;
  onRetryAdUsers: () => void;
}
