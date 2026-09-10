import type { SessionLikeUser } from '@/lib/permissions';

export const TASKBOARD_PAGE_SIZE = 50000;
export const TASKBOARD_QUERY_TIMEOUT = 8000;

export type DbClient = {
  query: <TRow = Record<string, unknown>>(query: string, values?: unknown[]) => Promise<{ rows: TRow[] }>;
  release: () => void;
};

export type TaskboardUser = SessionLikeUser & {
  id: string;
  role?: string;
};

export type TaskboardSession = {
  user: TaskboardUser;
};

export type TaskboardApplicantRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  fitScore: number | null;
  status: string | null;
  statusId: string | null;
  applicationDate: Date | string | null;
  updatedAt: Date | string | null;
  positionId: string | null;
  recruiterId: string | null;
  parsedData: unknown;
  avatarUrl: string | null;
  positionTitle: string | null;
  recruiterName: string | null;
};

export type TaskboardApplicantFilters = {
  name: string | null;
  positionId: string | null;
  status: string | null;
  recruiterId: string | null;
  minFitScore: string | null;
  maxFitScore: string | null;
  applicationDateStart: string | null;
  applicationDateEnd: string | null;
  assignmentStatus: string | null;
  positionStatus: string | null;
  scoreStatus: string | null;
};

export type TaskboardPagination = {
  page: number;
  limit: number;
  offset: number;
};

export type TaskboardQueryParts = {
  whereClauses: string[];
  queryParams: unknown[];
  paramIndex: number;
};
