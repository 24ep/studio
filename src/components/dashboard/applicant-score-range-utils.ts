import parseISO from "date-fns/parseISO";
import type { Applicant } from "../../lib/types";
import { getScoreRangesForChart } from "../../lib/scoreUtils";
import type {
  ApplicantScorePeriodRange,
  ApplicantScorePeriodType,
  ApplicantScorePeriodUnit,
  ApplicantScoreRange,
} from "./applicant-score-distribution-types";
import { APPLICANT_SCORE_GRADE_ORDER } from "./applicant-score-distribution-constants";

function filterApplicantsByCreatedAt(applicants: Applicant[], startDate: Date, endDate: Date) {
  if (!applicants || applicants.length === 0) {
    return [];
  }

  return applicants.filter((applicant) => {
    if (!applicant.createdAt) return false;

    try {
      const applicantDate = parseISO(applicant.createdAt);
      return applicantDate >= startDate && applicantDate <= endDate;
    } catch {
      return false;
    }
  });
}

export function buildApplicantScoreRanges({
  applicants,
  initialData,
  periodType,
  periodUnit,
  periodN,
  periodRange,
}: {
  applicants: Applicant[];
  initialData?: Array<{ label: string; count: number }>;
  periodType: ApplicantScorePeriodType;
  periodUnit: ApplicantScorePeriodUnit;
  periodN: number;
  periodRange: ApplicantScorePeriodRange;
}): ApplicantScoreRange[] {
  const scoreRanges = getScoreRangesForChart();
  const isDefaultPeriod = periodType === "lastN" && periodUnit === "day" && periodN === 7;

  if (initialData && isDefaultPeriod) {
    return scoreRanges.map((range) => {
      const preCalculated = initialData.find((item) => item.label === range.label);
      return { ...range, count: preCalculated?.count || 0 };
    });
  }

  const rangeCounts = scoreRanges.map((range) => ({ ...range, count: 0 }));
  const filteredApplicants = filterApplicantsByCreatedAt(
    applicants,
    periodRange.startDate,
    periodRange.endDate,
  );

  filteredApplicants.forEach((applicant) => {
    if (applicant.fitScore === null || applicant.fitScore === undefined) {
      return;
    }

    const normalizedScore = Math.round(applicant.fitScore);
    const range = rangeCounts.find((item) => normalizedScore >= item.min && normalizedScore <= item.max);
    if (range) {
      range.count++;
    }
  });

  return rangeCounts;
}

export function sortApplicantScoreRanges(scoreRanges: ApplicantScoreRange[]) {
  return [...scoreRanges].sort((itemA, itemB) => {
    const aGrade = itemA.letter || itemA.label[0];
    const bGrade = itemB.letter || itemB.label[0];
    return APPLICANT_SCORE_GRADE_ORDER.indexOf(aGrade) - APPLICANT_SCORE_GRADE_ORDER.indexOf(bGrade);
  });
}

export function buildApplicantScoreQuery(range: ApplicantScoreRange) {
  return `minAppliedJobFitScore:${range.min} maxAppliedJobFitScore:${range.max}`;
}
