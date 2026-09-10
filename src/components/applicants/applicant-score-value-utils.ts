import type { Applicant } from "@/lib/types";
import { normalizeFitScore } from "../../lib/scoreUtils";

import {
  getApplicantParsedArrayValue,
  getApplicantParsedValue,
  isApplicantParsedRecord,
} from "./applicant-parsed-data-utils";

export function collectAppliedScores(applicant: Applicant) {
  const appliedScores: number[] = [];

  if (applicant.fitScore !== null && applicant.fitScore !== undefined) {
    appliedScores.push(normalizeFitScore(applicant.fitScore));
  }

  const parsedJobAppliedScore = getParsedFitScore(
    getApplicantParsedValue(applicant.parsedData, "job_applied")
  );
  if (parsedJobAppliedScore !== undefined) {
    appliedScores.push(parsedJobAppliedScore);
  }

  return appliedScores;
}

export function collectMatchingScores(applicant: Applicant) {
  const jobMatches = Array.isArray(applicant.jobMatches) ? applicant.jobMatches : [];
  const parsedJobMatches = getApplicantParsedArrayValue(applicant.parsedData, "job_matches");

  return [
    ...jobMatches.map(match => normalizeFitScore(match.fitScore)),
    ...parsedJobMatches
      .map(getParsedFitScore)
      .filter((score): score is number => score !== undefined),
  ];
}

function getParsedFitScore(value: unknown) {
  if (!isApplicantParsedRecord(value) || typeof value.fitScore !== "number") {
    return undefined;
  }

  return normalizeFitScore(value.fitScore);
}
