import type { DateRange } from "react-day-picker";
import type { getScoreRangesForChart } from "../../lib/scoreUtils";

export type ApplicantScorePeriodType = "today" | "yesterday" | "lastN" | "this" | "pastN" | "custom";
export type ApplicantScorePeriodUnit = "day" | "week" | "month" | "year";

export interface ApplicantScorePeriodRange {
  startDate: Date;
  endDate: Date;
}

export type ApplicantScoreRange = ReturnType<typeof getScoreRangesForChart>[number] & {
  count: number;
};

export interface ApplicantScorePeriodInput {
  periodType: ApplicantScorePeriodType;
  periodUnit: ApplicantScorePeriodUnit;
  periodN: number;
  dateRange?: DateRange;
  now?: Date;
}
