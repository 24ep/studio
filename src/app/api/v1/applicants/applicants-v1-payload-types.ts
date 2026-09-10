import type { CreateApplicantInput } from './applicants-v1-schema';

export type JsonRecord = Record<string, unknown>;

export type ApplicantInfo = JsonRecord & {
  personal_info: JsonRecord & {
    firstname?: string | null;
    lastname?: string | null;
  };
  contact_info: JsonRecord & {
    email?: string | null;
    phone?: string | null;
  };
  job_applied?: unknown;
  job_matches: unknown[];
  fitScore?: number | null;
  emailDate?: string | null;
  emailSubject?: string | null;
  emailId?: string | null;
  emailMetadata?: Record<string, unknown> | null;
};

export type JobReference = {
  fitScore?: unknown;
  jobId?: unknown;
};

export type ApplicantInfoInput = CreateApplicantInput['applicant_info'];
