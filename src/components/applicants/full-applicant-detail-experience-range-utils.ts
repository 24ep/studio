import { differenceInMonths } from "date-fns";

interface ApplicantExperienceDateRange {
  startDate: Date;
  endDate: Date;
}

function getNumberField(entry: Record<string, unknown>, key: string) {
  const value = Number(entry[key]);
  return Number.isFinite(value) ? value : null;
}

function getExperienceEndDate(
  entry: Record<string, unknown>,
  currentDate: Date
) {
  const endYear = getNumberField(entry, "endYear");
  const endMonth = getNumberField(entry, "endMonth");

  if (endYear !== null && endMonth !== null) {
    return new Date(endYear, endMonth - 1);
  }

  return entry.isCurrent ? currentDate : null;
}

export function getApplicantExperienceDateRange(
  experience: unknown,
  currentDate: Date
): ApplicantExperienceDateRange | null {
  if (!experience || typeof experience !== "object") {
    return null;
  }

  const entry = experience as Record<string, unknown>;
  const startYear = getNumberField(entry, "startYear");
  const startMonth = getNumberField(entry, "startMonth");

  if (startYear === null || startMonth === null) {
    return null;
  }

  const endDate = getExperienceEndDate(entry, currentDate);
  return endDate ? {
    startDate: new Date(startYear, startMonth - 1),
    endDate,
  } : null;
}

export function getApplicantExperienceDurationMonths(
  experience: unknown,
  currentDate: Date
) {
  const dateRange = getApplicantExperienceDateRange(experience, currentDate);
  return dateRange
    ? Math.max(0, differenceInMonths(dateRange.endDate, dateRange.startDate))
    : 0;
}
