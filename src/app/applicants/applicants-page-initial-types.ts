import type { Applicant, Position, RecruitmentStage } from '@/lib/types';

export type DbDateValue = Date | string | null | undefined;

export interface ApplicantsPageInitialData {
  initialApplicants: Applicant[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  initialFetchError?: string;
}

export interface ApplicantInitialRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  statusId?: string | null;
  status?: string | null;
  positionId?: string | null;
  recruiterId?: string | null;
  sourceId?: string | null;
  fitScore?: number | null;
  applicationDate?: DbDateValue;
  updatedAt?: DbDateValue;
  parsedData?: unknown;
  positionTitle?: string | null;
  recruiterName?: string | null;
  sourceName?: string | null;
  isBlacklisted?: boolean | null;
}

export interface PositionInitialRow {
  id: string;
  title: string;
  department?: string | null;
  isOpen?: boolean | null;
  createdAt?: DbDateValue;
  updatedAt?: DbDateValue;
  recruiterName?: string | null;
  gradeName?: string | null;
  gradeSlaDays?: number | null;
  gradeColor?: string | null;
}

export interface RecruitmentStageInitialRow {
  id: string;
  name: string;
  sort_order?: number | null;
  sortOrder?: number | null;
  color?: string | null;
  color_badge?: string | null;
  description?: string | null;
  isSystem?: boolean | null;
  createdAt?: DbDateValue;
  updatedAt?: DbDateValue;
}
