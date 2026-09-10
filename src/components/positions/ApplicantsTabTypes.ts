import type { Applicant, ApplicantFilterValues, ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';

export type PositionApplicantTab = 'applied' | 'potential';

export interface VisibleApplicantColumns extends Record<string, boolean> {
  name: boolean;
  fitScore: boolean;
  expectedSalary: boolean;
  status: boolean;
  applicationDate: boolean;
  actions: boolean;
}

export type ApplicantPinToggle = (applicant: Applicant) => Promise<void>;

export interface ApplicantsTabProps {
  isMobile: boolean;
  isJobMatchEnabled: boolean;
  activeApplicantTab: PositionApplicantTab;
  onActiveApplicantTabChange: (tab: PositionApplicantTab) => void;
  appliedApplicants: Applicant[];
  sortedAppliedApplicants: Applicant[];
  appliedApplicantsSearchTerm: string;
  appliedApplicantsSortColumn: string | null;
  appliedApplicantsSortDirection: 'asc' | 'desc';
  appliedApplicantsOpenMenu: string | null;
  appliedApplicantsPage: number;
  appliedApplicantsPageSize: number;
  appliedApplicantsTotal: number;
  appliedApplicantsCount: number;
  onAppliedApplicantsSearchChange: (term: string) => void;
  onAppliedApplicantsSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onAppliedApplicantsOpenMenuChange: (menu: string | null) => void;
  onAppliedApplicantsPageChange: (page: number) => void;
  onAppliedApplicantsPageSizeChange: (size: number) => void;
  onAppliedApplicantPinToggle: (applicant: Applicant) => Promise<void>;
  potentialApplicants: Applicant[];
  sortedPotentialApplicants: Applicant[];
  potentialApplicantsSearchTerm: string;
  potentialApplicantsSortColumn: string | null;
  potentialApplicantsSortDirection: 'asc' | 'desc';
  potentialApplicantsOpenMenu: string | null;
  potentialApplicantsPage: number;
  potentialApplicantsPageSize: number;
  potentialApplicantsTotal: number;
  onPotentialApplicantsSearchChange: (term: string) => void;
  onPotentialApplicantsSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onPotentialApplicantsOpenMenuChange: (menu: string | null) => void;
  onPotentialApplicantsPageChange: (page: number) => void;
  onPotentialApplicantsPageSizeChange: (size: number) => void;
  onPotentialApplicantPinToggle: (applicant: Applicant) => Promise<void>;
  stageNames: Record<string, string>;
  onApplicantClick: (applicantId: string) => void;
  applicantFilters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  onAiSearch: (query: string) => void;
  onClearFilters?: () => void;
  isAiSearching?: boolean;
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  availableStages: RecruitmentStage[];
  availableSources: ApplicantSource[];
  availablePositions: Position[];
}
