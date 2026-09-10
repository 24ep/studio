import { APPLICANT_SCORE_GRADE_COLORS } from "./applicant-score-distribution-constants";
import type { ApplicantScoreRange } from "./applicant-score-distribution-types";
import { sortApplicantScoreRanges } from "./applicant-score-range-utils";

export function buildApplicantScoreChartData(scoreRanges: ApplicantScoreRange[]) {
  const sortedScoreRanges = sortApplicantScoreRanges(scoreRanges);

  return {
    labels: sortedScoreRanges.map((range) => range.label),
    datasets: [
      {
        label: "Applicants",
        data: sortedScoreRanges.map((range) => range.count),
        backgroundColor: APPLICANT_SCORE_GRADE_COLORS,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
      },
    ],
  };
}
