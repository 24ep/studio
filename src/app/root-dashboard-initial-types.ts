import type { Applicant, Position, UserProfile } from '@/lib/types';

export type DbDateValue = Date | string | null | undefined;

export interface RootDashboardInitialData {
  initialApplicants: Applicant[];
  initialPositions: Position[];
  initialUsers: UserProfile[];
  initialFetchError?: string;
  initialStageIds: Record<string, string | undefined>;
  initialStageNames: Record<string, string>;
}

export interface DashboardApplicantRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dataAiHint?: string | null;
  resumePath?: string | null;
  parsedData?: unknown;
  customAttributes?: unknown;
  positionId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  positionLevel?: string | null;
  positionIsOpen?: boolean | null;
  fitScore?: number | null;
  statusId?: string | null;
  status?: string | null;
  applicationDate?: DbDateValue;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterAvatarUrl?: string | null;
  createdAt?: DbDateValue;
  updatedAt?: DbDateValue;
  transitionHistory?: Applicant['transitionHistory'] | null;
}

export interface DashboardPositionRow {
  id: string;
  title: string;
  department?: string | null;
  description?: string | null;
  requirements?: string | null;
  isOpen?: boolean | null;
  positionLevel?: string | null;
  createdAt?: DbDateValue;
  updatedAt?: DbDateValue;
}

export interface DashboardUserRow {
  id: string;
  name: string;
  email: string;
  role: UserProfile['role'];
  avatarUrl?: string | null;
  createdAt?: DbDateValue;
  updatedAt?: DbDateValue;
}

export interface DashboardStageRow {
  id: string;
  name: string;
}
