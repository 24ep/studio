import { getApplicantParsedArrayField } from "./applicant-parsed-data-utils";
import {
  formatCompactMonthDuration,
  formatVerboseMonthDuration,
} from "./full-applicant-detail-experience-format-utils";
import {
  getApplicantExperienceDurationMonths,
} from "./full-applicant-detail-experience-range-utils";

export function getApplicantParsedEntries(parsedData: unknown, key: "education" | "experience") {
  return getApplicantParsedArrayField(parsedData, key);
}

export function calculateApplicantTotalExperienceDuration(experienceArray: unknown[], currentDate = new Date()) {
  const totalMonths = (Array.isArray(experienceArray) ? experienceArray : []).reduce<number>((sum, experience) => {
    return sum + getApplicantExperienceDurationMonths(experience, currentDate);
  }, 0);

  return formatVerboseMonthDuration(totalMonths);
}

export function calculateApplicantAverageExperienceDuration(experienceArray: unknown[], currentDate = new Date()) {
  const durations = (Array.isArray(experienceArray) ? experienceArray : [])
    .map(experience => getApplicantExperienceDurationMonths(experience, currentDate))
    .filter(months => months > 0);

  if (durations.length === 0) {
    return "";
  }

  const averageMonths = Math.round(durations.reduce((sum, months) => sum + months, 0) / durations.length);

  return formatVerboseMonthDuration(averageMonths);
}

export function formatApplicantExperienceDuration(parsedData: unknown, currentDate = new Date()) {
  const totalMonths = getApplicantParsedEntries(parsedData, "experience")
    .reduce((sum, experience) => sum + getApplicantExperienceDurationMonths(experience, currentDate), 0);

  return formatCompactMonthDuration(totalMonths);
}
