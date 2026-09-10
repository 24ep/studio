import type { ApplicantFilterValues } from "../../../lib/types";

interface RefreshApplicantListOptions {
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
}

export * from "./applicant-action-api-utils";
export * from "./applicant-assignment-mutation-utils";
export * from "./applicant-list-mutation-utils";

export function refreshApplicantList({ fetchTableData, filters, page, pageSize }: RefreshApplicantListOptions) {
  void fetchTableData(filters, page, pageSize);
}

export function isApplicantAiSearchLocked(aiMatchedApplicantIds: string[] | null) {
  return aiMatchedApplicantIds !== null;
}
