import type { ApplicantScorePeriodType, ApplicantScorePeriodUnit } from "./applicant-score-distribution-types";

export const APPLICANT_SCORE_PERIOD_TYPES: Array<{ label: string; value: ApplicantScorePeriodType }> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last", value: "lastN" },
  { label: "This", value: "this" },
  { label: "Past", value: "pastN" },
  { label: "Custom", value: "custom" },
];

export const APPLICANT_SCORE_PERIOD_UNITS: Array<{ label: string; value: ApplicantScorePeriodUnit }> = [
  { label: "Day(s)", value: "day" },
  { label: "Week(s)", value: "week" },
  { label: "Month(s)", value: "month" },
  { label: "Year(s)", value: "year" },
];

export const APPLICANT_SCORE_PERIOD_COUNTS = [1, 2, 3, 4, 5, 6, 7, 14, 30, 60, 90];

export const APPLICANT_SCORE_GRADE_COLORS = [
  "rgba(163, 230, 53, 0.8)",
  "rgba(250, 204, 21, 0.8)",
  "rgba(254, 240, 138, 0.8)",
  "rgba(251, 146, 60, 0.8)",
  "rgba(248, 113, 113, 0.8)",
];

export const APPLICANT_SCORE_GRADE_ORDER = ["A", "B", "C", "D", "E"];
