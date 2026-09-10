export interface ApplicantStageLike {
  id?: string | null;
  name?: string | null;
}

export interface ApplicantPositionLike {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  department?: string | null;
  requirements?: unknown;
  isOpen?: boolean | null;
  gradeId?: string | null;
  grade?: {
    name?: string | null;
    color?: string | null;
  } | null;
}

export interface ApplicantJobMatchLike {
  jobId?: string | null;
  jobTitle?: string | null;
  fitScore?: unknown;
  matchReasons?: unknown;
}

export interface ApplicantJobMatchModalData {
  jobId: string;
  jobTitle: string;
  fitScore: number;
  matchReasons: string[];
  position?: {
    id: string;
    title: string;
    description?: string;
    department?: string;
    location?: string;
    salary?: string;
    requirements?: unknown;
    isOpen: boolean;
  };
}

export interface ApplicantEditParsedDataFormValue {
  personal_info: Record<string, unknown>;
  contact_info: Record<string, unknown>;
  education: unknown[];
  experience: unknown[];
  skills: unknown[];
  job_suitable: unknown[];
  job_matches: unknown[];
}

export interface ApplicantEditFormValues {
  email: string;
  phone: string;
  positionId: string | null;
  recruiterId: string | null;
  sourceId: string | null;
  fitScore: number | null | undefined;
  status: string;
  expectedSalary: unknown;
  assignmentJustification: string[];
  parsedData: ApplicantEditParsedDataFormValue;
}
