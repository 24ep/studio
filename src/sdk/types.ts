export type SdkRecord = Record<string, unknown>;

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export interface Page<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface User extends SdkRecord {
  id: string;
  email: string;
  role: string;
  modulePermissions: string[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginData extends SdkRecord {
  success: boolean;
  token: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

/** Current API envelope plus optional flattened fields for older installations. */
export type LoginResponse = ApiEnvelope<LoginData> & Partial<LoginData>;

export interface ApplicantListData extends SdkRecord {
  data: Applicant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PositionListData extends SdkRecord {
  data: Position[];
  total: number;
}

export interface UserListData extends SdkRecord {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface Position extends SdkRecord {
  id: string;
  title: string;
  department: string;
  description?: string | null;
  isOpen: boolean;
  positionLevel?: string | null;
}

export interface Applicant extends SdkRecord {
  id: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  email: string;
  phone?: string | null;
  status?: string | null;
}

export interface HealthResponse extends SdkRecord {
  status: string;
  timestamp: string;
  version?: string;
  api?: string;
}

export interface JobMatchStatus extends SdkRecord {
  isJobMatchEnabled: boolean;
  settingValue: string;
  defaultBehavior: string;
}

export type JobMatchStatusResponse = ApiEnvelope<JobMatchStatus>;
