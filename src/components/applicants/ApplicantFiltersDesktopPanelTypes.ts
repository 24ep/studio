import type {
  ApplicantCustomFieldFilterValue,
  ApplicantSource,
  CustomFieldDefinition,
  RecruitmentStage,
  UserProfile,
} from '@/lib/types';

export type ApplicantFilterTextOperator = 'contains' | 'is' | 'startsWith' | 'endsWith';
export type ApplicantFilterLocationOperator = ApplicantFilterTextOperator | 'other';

export interface ApplicantFiltersDesktopPanelProps {
  isLoading?: boolean;
  isAiSearching?: boolean;
  isApplyingFilters: boolean;
  aiSearchQueryInput: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  nameOperator: ApplicantFilterTextOperator;
  emailOperator: ApplicantFilterTextOperator;
  phoneOperator: ApplicantFilterTextOperator;
  locationOperator: ApplicantFilterLocationOperator;
  skills: Set<string>;
  selectedPositionIds: Set<string>;
  selectedStatuses: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  experienceYearsRange: [number, number];
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  filterableCustomFields: CustomFieldDefinition[];
  isLoadingCustomFields: boolean;
  availableStages: RecruitmentStage[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  onAiQueryChange: (query: string) => void;
  onAiSearch: () => void;
  onCancelAiSearch?: () => void;
  onReset: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNameOperatorChange: (operator: ApplicantFilterTextOperator) => void;
  onEmailOperatorChange: (operator: ApplicantFilterTextOperator) => void;
  onPhoneOperatorChange: (operator: ApplicantFilterTextOperator) => void;
  onLocationOperatorChange: (operator: ApplicantFilterLocationOperator) => void;
  onSkillsChange: (skills: Set<string>) => void;
  onNameFocus: () => void;
  onNameBlur: () => void;
  onLocationFocus: () => void;
  onLocationBlur: () => void;
  onApply: () => void;
  onScheduleSkillsApply: () => void;
  onPositionChange: (ids: Set<string>) => void;
  onStatusChange: (ids: Set<string>) => void;
  onRecruiterChange: (ids: Set<string>) => void;
  onSourceChange: (ids: Set<string>) => void;
  onExperienceYearsRangeChange: (range: [number, number]) => void;
  onNoExperienceToggle: (checked: boolean) => void;
  onCustomFieldFiltersChange: (filters: Record<string, ApplicantCustomFieldFilterValue>) => void;
  onScheduleApply: (delay?: number) => void;
}
