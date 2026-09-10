export interface WaitingEvaluation {
  evaluator?: {
    id?: string | null;
  } | null;
  status?: string | null;
  personalityScores?: unknown[] | null;
  expertiseScores?: unknown[] | null;
  overallScore?: number | null;
}

export interface EvaluationWaitingInterviewer {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  avatarUrl?: string | null;
}
