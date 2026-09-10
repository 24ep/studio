export interface ClearDuplicatesRequest {
  dryRun?: boolean;
  positionId?: string | null;
}

export interface DuplicateApplicant {
  id: string;
  name: string;
  email: string;
  positionId: string | null;
  fitScore: number | null;
  createdAt: Date;
}

export interface DuplicateGroup {
  email: string;
  positionId: string | null;
  applicants: DuplicateApplicant[];
}

export interface DuplicateAnalysisResult {
  duplicateGroups: DuplicateGroup[];
  keptApplicants: DuplicateApplicant[];
  applicantsToDelete: DuplicateApplicant[];
  totalToDelete: number;
}
