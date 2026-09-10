import type { Dispatch, SetStateAction } from 'react';

import type {
  ApplicantCustomFieldFilterValue,
  CustomFieldDefinition,
} from '@/lib/types';
import type { ApplicantFilterOption } from './applicant-filter-query-utils';

export type TextOperator = 'contains' | 'is' | 'startsWith' | 'endsWith';

export interface ApplicantFiltersMobileContentProps {
  activeTab: 'filters' | 'advanced';
  className?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: Set<string>;
  nameOperator: TextOperator;
  emailOperator: TextOperator;
  phoneOperator: TextOperator;
  selectedStatuses: Set<string>;
  selectedPositionIds: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  experienceYearsRange: [number, number];
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  filterableCustomFields: CustomFieldDefinition[];
  expandedAttributes: { [key: string]: boolean };
  stageOptions: ApplicantFilterOption[];
  positionOptions: ApplicantFilterOption[];
  recruiterOptions: ApplicantFilterOption[];
  sourceOptions: ApplicantFilterOption[];
  hasActiveFilters: boolean;
  advancedQueryInput: string;
  advancedQuery?: string;
  queryValidationError: string | null;
  queryHistory: string[];
  showQueryHistory: boolean;
  onTabChange: (tab: 'filters' | 'advanced') => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSkillsChange: Dispatch<SetStateAction<Set<string>>>;
  onNameOperatorChange: Dispatch<SetStateAction<TextOperator>>;
  onEmailOperatorChange: Dispatch<SetStateAction<TextOperator>>;
  onPhoneOperatorChange: Dispatch<SetStateAction<TextOperator>>;
  onStatusesChange: Dispatch<SetStateAction<Set<string>>>;
  onPositionIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onRecruiterIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onSourceIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onExperienceYearsRangeChange: Dispatch<SetStateAction<[number, number]>>;
  onCustomFieldFiltersChange: Dispatch<SetStateAction<Record<string, ApplicantCustomFieldFilterValue>>>;
  onToggleSeeMore: (attributeKey: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onAdvancedQueryChange: (query: string) => void;
  onAdvancedValidationErrorChange: (error: string | null) => void;
  onApplyAdvancedQuery: () => void;
  onClearAdvancedQuery: () => void;
  onOpenAdvancedSyntax: () => void;
  onToggleQueryHistory: () => void;
  onRemoveHistoryQuery: (index: number) => void;
}
