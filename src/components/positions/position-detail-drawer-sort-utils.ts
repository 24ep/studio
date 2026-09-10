import type { Applicant } from "@/lib/types";
import type { ApplicantSortDirection, ApplicantSortState } from "./position-detail-drawer-types";

export function getNextApplicantSortState(
  currentColumn: string | null,
  currentDirection: ApplicantSortDirection,
  nextColumn: string | null,
  requestedDirection?: ApplicantSortDirection | null,
): ApplicantSortState {
  if (!nextColumn) {
    return { sortColumn: null, sortDirection: "asc" };
  }

  if (currentColumn === nextColumn && (requestedDirection === null || requestedDirection === undefined)) {
    return {
      sortColumn: nextColumn,
      sortDirection: currentDirection === "asc" ? "desc" : "asc",
    };
  }

  return {
    sortColumn: nextColumn,
    sortDirection: requestedDirection || (nextColumn === "fitScore" ? "desc" : "asc"),
  };
}

export function sortPositionDrawerApplicants(
  applicants: Applicant[],
  sortColumn: string | null,
  sortDirection: ApplicantSortDirection,
  serverSortedColumns: string[] = [],
) {
  if (!sortColumn || serverSortedColumns.includes(sortColumn)) {
    return applicants;
  }

  return [...applicants].sort((applicantA, applicantB) => {
    const valueA = getApplicantSortableValue(applicantA, sortColumn);
    const valueB = getApplicantSortableValue(applicantB, sortColumn);

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

function getApplicantSortableValue(applicant: Applicant, column: string) {
  switch (column) {
    case "name":
      return applicant.name?.toLowerCase() || "";
    case "email":
      return applicant.email?.toLowerCase() || "";
    case "expectedSalary":
      return applicant.expectedSalary || 0;
    case "fitScore":
      return applicant.fitScore || 0;
    case "status":
      return (applicant.statusId || applicant.status)?.toLowerCase() || "";
    case "applicationDate":
      return applicant.applicationDate ? new Date(applicant.applicationDate).getTime() : 0;
    default:
      return "";
  }
}
