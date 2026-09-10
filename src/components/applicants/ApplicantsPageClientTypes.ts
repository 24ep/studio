import type { Applicant, ApplicantFilterValues, Position, RecruitmentStage } from '@/lib/types';

export interface ApplicantsPageClientProps {
  initialApplicants: Applicant[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  userSession?: {
    id: string;
    role: string;
    name: string | null;
    modulePermissions?: string[];
  } | null;
  authError?: boolean;
  permissionError?: boolean;
  initialFetchError?: string;
  initialFilters?: ApplicantFilterValues;
}
