export interface RecruiterStats {
  unassigned?: number;
  unassignedVacant?: number;
  [recruiterId: string]: number | undefined;
}

export interface RecruiterFilterRecruiter {
  id: string;
  name: string;
  avatarUrl?: string;
  personalColor?: string;
  vacantHeadcount?: number;
}

export interface RecruiterFilterSidebarProps {
  selectedRecruiterId: string | null;
  onRecruiterSelect: (recruiterId: string | null) => void;
  recruiterStats?: RecruiterStats;
  recruiters?: RecruiterFilterRecruiter[];
}
