import type { Applicant, ApplicantFilterValues } from "@/lib/types";

export type ApplicantSortDirection = "asc" | "desc";
export type PositionDrawerApplicantListType = "applied" | "all";

export interface RecruitmentStageLike {
  id?: string | null;
  name?: string | null;
}

export interface ApplicantSortState {
  sortColumn: string | null;
  sortDirection: ApplicantSortDirection;
}

export interface PositionEditFormDefaults {
  title: string;
  department: string;
  description: string;
  matchCriteria: string;
  isOpen: boolean;
  positionLevel: string;
  probationPeriodDays: number;
  probationEvaluationFrequencyDays: number;
  gradeId: string | null;
  recruiterId: string | null;
  onboardingClientId: string | null;
  onboardingAssetTypes: string[];
  location: string;
  employmentType: string;
  workModel: string;
  salaryRange: string;
  targetStartDate: string;
  hiringManagerName: string;
  successOutcomes: string[];
  coreResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  matchCriteriaPreview: string[];
}

export interface PositionDrawerSheetOpenChangeAction {
  shouldNotifyOpenChange: boolean;
  nextOpen: boolean;
  shouldResetManualCloseRequest: boolean;
}

export interface JobDescriptionRequiredFields {
  title?: string | null;
  department?: string | null;
  positionLevel?: string | null;
}

export interface BuildPositionApplicantsQueryInput {
  page: number;
  pageSize: number;
  applicantType: PositionDrawerApplicantListType;
  searchTerm: string;
  sortColumn: string | null;
  sortDirection: ApplicantSortDirection;
  filters?: ApplicantFilterValues;
}

export interface BuildPotentialPositionApplicantsQueryInput {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string | null;
  sortDirection: ApplicantSortDirection;
  filters?: ApplicantFilterValues;
}

export interface FetchPositionApplicantsPageInput extends BuildPositionApplicantsQueryInput {
  positionId: string;
}

export interface FetchPotentialPositionApplicantsPageInput extends BuildPotentialPositionApplicantsQueryInput {
  positionId: string;
}

export interface PositionApplicantsPageResult {
  applicants: Applicant[];
  total: number;
}

export type PositionApplicantFetch = typeof fetch;
