import type { Dispatch, SetStateAction } from "react";

import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from "@/lib/types";
import {
  createApplicantSkillsSet,
  parseApplicantFilterDateRange,
} from "../applicant-filter-query-utils";

export type TextOperator = "contains" | "is" | "startsWith" | "endsWith";
export type LocationOperator = TextOperator | "other";

export interface ApplicantStandardFilterInitialState {
  aiSearchQueryInput: string;
  applicationDateRange: ReturnType<typeof parseApplicantFilterDateRange>;
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  email: string;
  experienceYearsRange: [number, number];
  location: string;
  locationOperator: LocationOperator;
  name: string;
  phone: string;
  selectedPositionIds: Set<string>;
  selectedRecruiterIds: Set<string>;
  selectedSourceIds: Set<string>;
  selectedStatuses: Set<string>;
  skills: Set<string>;
}

export interface AdvancedQuerySyncSetters {
  setApplicationDateRange: Dispatch<SetStateAction<ReturnType<typeof parseApplicantFilterDateRange>>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setLocation: Dispatch<SetStateAction<string>>;
  setLocationOperator: Dispatch<SetStateAction<LocationOperator>>;
  setName: Dispatch<SetStateAction<string>>;
  setPhone: Dispatch<SetStateAction<string>>;
  setSelectedPositionIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedRecruiterIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedStatuses: Dispatch<SetStateAction<Set<string>>>;
}

export function createApplicantStandardFilterInitialState(
  initialFilters: ApplicantFilterValues,
): ApplicantStandardFilterInitialState {
  return {
    aiSearchQueryInput: initialFilters.aiSearchQuery || "",
    applicationDateRange: parseApplicantFilterDateRange(initialFilters),
    customFieldFilters: initialFilters.customFieldFilters || {},
    email: initialFilters.email || "",
    experienceYearsRange: [
      initialFilters.minExperienceYears ?? -1,
      initialFilters.maxExperienceYears || 50,
    ],
    location: initialFilters.location || "",
    locationOperator: initialFilters.locationOperator || "contains",
    name: initialFilters.name || "",
    phone: initialFilters.phone || "",
    selectedPositionIds: new Set(initialFilters.selectedPositionIds || []),
    selectedRecruiterIds: new Set(initialFilters.selectedRecruiterIds || []),
    selectedSourceIds: new Set(initialFilters.selectedSourceIds || []),
    selectedStatuses: initialFilters.selectedStatuses && initialFilters.selectedStatuses.length > 0
      ? new Set(initialFilters.selectedStatuses)
      : new Set(),
    skills: createApplicantSkillsSet(initialFilters.skills),
  };
}

export function syncAdvancedQueryFiltersToStandardState({
  isTypingLocation,
  isTypingName,
  parsedFilters,
  setters,
}: {
  isTypingLocation: boolean;
  isTypingName: boolean;
  parsedFilters: ApplicantFilterValues;
  setters: AdvancedQuerySyncSetters;
}) {
  if (parsedFilters.name && !isTypingName) setters.setName(parsedFilters.name);
  if (parsedFilters.email) setters.setEmail(parsedFilters.email);
  if (parsedFilters.phone) setters.setPhone(parsedFilters.phone);
  if (parsedFilters.selectedPositionIds) setters.setSelectedPositionIds(new Set(parsedFilters.selectedPositionIds));
  if (parsedFilters.selectedStatuses) setters.setSelectedStatuses(new Set(parsedFilters.selectedStatuses));
  if (parsedFilters.selectedRecruiterIds) setters.setSelectedRecruiterIds(new Set(parsedFilters.selectedRecruiterIds));

  if (parsedFilters.applicationDateStart || parsedFilters.applicationDateEnd) {
    setters.setApplicationDateRange({
      from: parsedFilters.applicationDateStart,
      to: parsedFilters.applicationDateEnd,
    });
  }

  if (parsedFilters.location && !isTypingLocation) setters.setLocation(parsedFilters.location);
  if (parsedFilters.locationOperator) setters.setLocationOperator(parsedFilters.locationOperator);
}
