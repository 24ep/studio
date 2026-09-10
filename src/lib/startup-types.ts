export type StartupServiceStatus = 'success' | 'warning' | 'error' | 'skipped';

export interface StartupServiceResult {
  status: StartupServiceStatus;
  message: string;
  bucket?: string;
  error?: string;
}

export interface StartupResult {
  minio: StartupServiceResult;
  database: StartupServiceResult;
  redis: StartupServiceResult;
  seeding: StartupServiceResult;
  overall: 'ready' | 'partial' | 'failed';
}

export interface ServiceInitializationResult {
  minio: Pick<StartupServiceResult, 'status' | 'message'>;
  redis: Pick<StartupServiceResult, 'status' | 'message'>;
}
