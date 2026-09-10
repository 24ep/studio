import type {
  ApplicantFilterValues,
  ApplicantSource,
  Position,
  RecruitmentStage,
  UserProfile,
} from "@/lib/types";

export type SearchParamsLike = Pick<URLSearchParams, "get">;

export interface ClearedApplicantAiSearchState {
  aiMatchedApplicantIds: string[] | null;
  aiSearchReasoning: string | null;
  aiRecordCount: number;
  isAiSearchActive: boolean;
}

export type ApplicantHorizontalFitScoreFilterAction =
  | { type: "merge"; filters: ApplicantFilterValues }
  | { type: "clear" }
  | { type: "skip" };

export interface ApplicantHorizontalFitScoreFilterActionInput {
  appliedGrades?: ReadonlySet<string> | null;
  matchingGrades?: ReadonlySet<string> | null;
  horizontalFilters?: ApplicantFilterValues | null;
}

export interface ApplicantFilterApiData {
  positions?: Position[] | null;
  stages?: Array<{
    id: string;
    name: string;
    sort_order: number;
    color?: string | null;
    description?: string | null;
  }> | null;
  recruiters?: Array<Pick<UserProfile, "id" | "name" | "email" | "avatarUrl" | "personalColor">> | null;
  sources?: Array<Pick<ApplicantSource, "id" | "name" | "description" | "logo">> | null;
}

export interface ApplicantFilterFallbackData {
  positions?: Position[] | null;
  stages?: RecruitmentStage[] | null;
  recruiters?: Array<Pick<UserProfile, "id" | "name" | "email" | "avatarUrl" | "personalColor">> | null;
  sources?: ApplicantSource[] | null;
}

export interface ApplicantTableFetchDecisionInput {
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  isClearingFilters: boolean;
  hasInitialDataFetch: boolean;
  hasAdvancedQuery?: boolean;
  filters?: ApplicantFilterValues | null;
  initialApplicantsCount: number;
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: string | null;
  currentRequestId?: string | null;
}
