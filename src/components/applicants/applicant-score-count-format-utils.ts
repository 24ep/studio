import { getScoreRangesForChart } from "../../lib/scoreUtils";

import type {
  ApplicantScoreCountBuckets,
  ApplicantScoreCounts,
} from "./applicant-score-count-types";

const NO_SCORE_LETTER = "no-score";

export function createApplicantScoreCountBuckets(): ApplicantScoreCountBuckets {
  return {
    applied: {},
    matching: {},
  };
}

export function buildEmptyScoreCounts(): ApplicantScoreCounts {
  return {
    applied: formatScoreCounts({}),
    matching: formatScoreCounts({}),
  };
}

export function addBestScoreOrNoScore(counts: Record<string, number>, scores: number[]) {
  if (scores.length === 0) {
    incrementScoreCount(counts, NO_SCORE_LETTER);
    return;
  }

  addScoreToRange(counts, Math.max(...scores));
}

export function formatApplicantScoreCountBuckets({
  applied,
  matching,
}: ApplicantScoreCountBuckets): ApplicantScoreCounts {
  return {
    applied: formatScoreCounts(applied),
    matching: formatScoreCounts(matching),
  };
}

function addScoreToRange(counts: Record<string, number>, score: number) {
  const range = getScoreRangesForChart().find(scoreRange => (
    score >= scoreRange.min && score <= scoreRange.max
  ));
  if (range) {
    incrementScoreCount(counts, range.letter);
  }
}

function formatScoreCounts(counts: Record<string, number>) {
  return [
    ...getScoreRangesForChart().map(range => ({
      letter: range.letter,
      count: counts[range.letter] || 0,
    })),
    {
      letter: NO_SCORE_LETTER,
      count: counts[NO_SCORE_LETTER] || 0,
    },
  ];
}

function incrementScoreCount(counts: Record<string, number>, letter: string) {
  counts[letter] = (counts[letter] || 0) + 1;
}
