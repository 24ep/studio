export type ScoreCount = { letter: string; count: number };

export interface ApplicantScoreCounts {
  applied: ScoreCount[];
  matching: ScoreCount[];
}

export interface ApplicantScoreCountBuckets {
  applied: Record<string, number>;
  matching: Record<string, number>;
}
