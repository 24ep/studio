export interface RecruiterSyncResult {
  positionId: string;
  positionTitle: string;
  applicantsUpdated: number;
  applicantsSkipped: number;
  errors: string[];
}

export interface RecruiterSyncPositionRow {
  id: string;
  title: string;
  recruiterId: string | null;
  recruiterName: string | null;
}

export interface RecruiterSyncApplicantRow {
  id: string;
  name: string;
  recruiterId: string | null;
  recruiterName?: string | null;
}

export interface RecruiterAssignmentTransitionInput {
  actingUserId: string;
  applicantId: string;
  positionId: string;
  recruiterLabel: string;
}
