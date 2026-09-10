export interface ApplicantRecruiterOption {
  id: string;
  name: string;
  avatarUrl?: string | null;
  personalColor?: string;
}

export interface ApplicantRecruiterCellApplicant {
  id: string;
  recruiterId?: string | null;
  recruiter?: ApplicantRecruiterOption | null;
}
