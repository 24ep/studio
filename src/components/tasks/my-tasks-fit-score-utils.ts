import { getScoreGrade } from "../../lib/scoreUtils";

import type { TaskboardApplicant } from "./my-tasks-page-types";

export const TASKBOARD_NO_SCORE_GRADE = "no-score";

const TASKBOARD_FIT_SCORE_GRADES = ["A", "B", "C", "D", "E"] as const;

export function getTaskboardFitScoreGrade(applicant: TaskboardApplicant) {
  const fitScore = applicant.fitScore;

  if (fitScore === null || fitScore === undefined || !Number.isFinite(fitScore) || fitScore <= 0) {
    return TASKBOARD_NO_SCORE_GRADE;
  }

  return getScoreGrade(fitScore) || TASKBOARD_NO_SCORE_GRADE;
}

export function buildTaskboardFitScoreCounts(applicants: TaskboardApplicant[]) {
  const counts = new Map<string, number>([
    ...TASKBOARD_FIT_SCORE_GRADES.map((grade) => [grade, 0] as const),
    [TASKBOARD_NO_SCORE_GRADE, 0],
  ]);

  for (const applicant of applicants) {
    const grade = getTaskboardFitScoreGrade(applicant);
    counts.set(grade, (counts.get(grade) || 0) + 1);
  }

  return Array.from(counts, ([letter, count]) => ({ letter, count }));
}
