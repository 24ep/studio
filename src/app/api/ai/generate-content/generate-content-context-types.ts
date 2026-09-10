export type GenerateContentRecord = Record<string, unknown>;

export interface GenerateContentApplicantData {
  applicant: GenerateContentRecord;
  comments: unknown[];
  transitions: unknown[];
  attachments: unknown[];
  applicantComments: unknown[];
  transitionRecords: unknown[];
  jobMatches: GenerateContentRecord[];
  appliedPositionData: GenerateContentRecord | null;
}
