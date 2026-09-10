import type { Position } from "@/lib/types";
import type {
  JobDescriptionRequiredFields,
  PositionDrawerSheetOpenChangeAction,
  PositionEditFormDefaults,
} from "./position-detail-drawer-types";

export function getPositionEditFormDefaults(position?: Partial<Position> | null): PositionEditFormDefaults {
  const onboardingDefaults = position?.custom_attributes || position?.customAttributes || {};
  const readString = (key: string) => typeof onboardingDefaults[key] === "string" ? onboardingDefaults[key] as string : "";
  const readStringArray = (key: string) => Array.isArray(onboardingDefaults[key])
    ? (onboardingDefaults[key] as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const assetTypes = Array.isArray(onboardingDefaults.onboardingAssetTypes)
    ? onboardingDefaults.onboardingAssetTypes.filter((item): item is string => typeof item === "string")
    : [];
  return {
    title: position?.title || "",
    department: position?.department || "",
    description: position?.description || "",
    matchCriteria: position?.matchCriteria || "",
    isOpen: position?.isOpen ?? true,
    positionLevel: position?.positionLevel || "",
    probationPeriodDays: position?.probationPeriodDays || 90,
    probationEvaluationFrequencyDays: position?.probationEvaluationFrequencyDays || 30,
    gradeId: position?.gradeId || null,
    recruiterId: position?.recruiterId || null,
    onboardingClientId: typeof onboardingDefaults.onboardingClientId === "string" ? onboardingDefaults.onboardingClientId : null,
    onboardingAssetTypes: assetTypes,
    location: readString("location"),
    employmentType: readString("employmentType"),
    workModel: readString("workModel"),
    salaryRange: readString("salaryRange"),
    targetStartDate: readString("targetStartDate"),
    hiringManagerName: readString("hiringManagerName"),
    successOutcomes: readStringArray("successOutcomes"),
    coreResponsibilities: readStringArray("coreResponsibilities"),
    requiredSkills: readStringArray("requiredSkills"),
    preferredSkills: readStringArray("preferredSkills"),
    matchCriteriaPreview: readStringArray("matchCriteriaPreview"),
  };
}

export function getMissingJobDescriptionFields({
  title,
  department,
  positionLevel,
}: JobDescriptionRequiredFields) {
  const missingFields: string[] = [];

  if (!title?.trim()) {
    missingFields.push("Position Title");
  }
  if (!department?.trim()) {
    missingFields.push("Department");
  }
  if (!positionLevel?.trim()) {
    missingFields.push("Position Level");
  }

  return missingFields;
}

export function getPositionDrawerSheetOpenChangeAction({
  nextOpen,
  isMobile,
  manualCloseRequested,
}: {
  nextOpen: boolean;
  isMobile: boolean;
  manualCloseRequested: boolean;
}): PositionDrawerSheetOpenChangeAction {
  if (isMobile && !nextOpen) {
    return {
      shouldNotifyOpenChange: manualCloseRequested,
      nextOpen: false,
      shouldResetManualCloseRequest: manualCloseRequested,
    };
  }

  if (!nextOpen && manualCloseRequested) {
    return {
      shouldNotifyOpenChange: true,
      nextOpen: false,
      shouldResetManualCloseRequest: true,
    };
  }

  return {
    shouldNotifyOpenChange: true,
    nextOpen,
    shouldResetManualCloseRequest: false,
  };
}
