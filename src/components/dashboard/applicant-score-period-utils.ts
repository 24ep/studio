import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { safeGetDateFromRange } from "../../lib/utils/format";
import type {
  ApplicantScorePeriodInput,
  ApplicantScorePeriodRange,
} from "./applicant-score-distribution-types";
import {
  buildApplicantScoreDayRange,
  buildCurrentApplicantScorePeriodRange,
  buildPastApplicantScorePeriodRange,
} from "./applicant-score-period-date-utils";

export function createDefaultApplicantScoreDateRange(now = new Date()): DateRange {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  return { from: startDate, to: now };
}

export function getApplicantScorePeriodRange({
  periodType,
  periodUnit,
  periodN,
  dateRange,
  now = new Date(),
}: ApplicantScorePeriodInput): ApplicantScorePeriodRange {
  if (periodType === "custom" && dateRange?.from && dateRange?.to) {
    const fromDate = safeGetDateFromRange(dateRange, "from");
    const toDate = safeGetDateFromRange(dateRange, "to");

    if (fromDate && toDate) {
      return { startDate: fromDate, endDate: toDate };
    }

    console.warn("Invalid date range provided, falling back to default period");
  }

  if (periodType === "today") {
    return buildApplicantScoreDayRange(now);
  }

  if (periodType === "yesterday") {
    return buildApplicantScoreDayRange(now, -1);
  }

  if (periodType === "lastN" || periodType === "pastN") {
    return buildPastApplicantScorePeriodRange({ now, periodN, periodUnit, excludeCurrentPeriod: true });
  }

  return buildCurrentApplicantScorePeriodRange(periodUnit, now);
}

export function formatApplicantScorePeriodDisplay({
  periodType,
  periodUnit,
  periodN,
  dateRange,
}: Omit<ApplicantScorePeriodInput, "now">) {
  if (periodType === "custom" && dateRange?.from && dateRange?.to) {
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
  }

  switch (periodType) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "lastN":
      return `Last ${periodN} ${periodUnit}${periodN > 1 ? "s" : ""}`;
    case "this":
      return `This ${periodUnit}`;
    case "pastN":
      return `Past ${periodN} ${periodUnit}${periodN > 1 ? "s" : ""}`;
    default:
      return "Last 7 days";
  }
}
