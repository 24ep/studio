const ALL_SCORE_GRADES = ['A', 'B', 'C', 'D', 'E', 'no-score'];

export type FitScoreCountRow = {
  applied_score: number | string | null;
  best_match_score: number | string | null;
};

function normalizeScore(score: number | string | null) {
  if (score === null || score === undefined) {
    return null;
  }

  const numericScore = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(numericScore)) {
    return null;
  }

  return numericScore >= 0 && numericScore <= 1
    ? Math.round(numericScore * 100)
    : Math.round(numericScore);
}

export function getScoreGrade(score: number | string | null): string {
  const normalizedScore = normalizeScore(score);
  if (normalizedScore === null || normalizedScore < 0 || normalizedScore > 100) {
    return 'no-score';
  }

  if (normalizedScore >= 81) return 'A';
  if (normalizedScore >= 61) return 'B';
  if (normalizedScore >= 41) return 'C';
  if (normalizedScore >= 21) return 'D';
  return 'E';
}

export function buildFitScoreGradeCounts(rows: FitScoreCountRow[]) {
  const appliedCounts: Record<string, number> = {};
  const matchingCounts: Record<string, number> = {};

  for (const row of rows) {
    const appliedGrade = getScoreGrade(row.applied_score);
    const matchingGrade = getScoreGrade(row.best_match_score);

    appliedCounts[appliedGrade] = (appliedCounts[appliedGrade] || 0) + 1;
    matchingCounts[matchingGrade] = (matchingCounts[matchingGrade] || 0) + 1;
  }

  return {
    applied: ALL_SCORE_GRADES.map(letter => ({ letter, count: appliedCounts[letter] || 0 })),
    matching: ALL_SCORE_GRADES.map(letter => ({ letter, count: matchingCounts[letter] || 0 })),
  };
}
