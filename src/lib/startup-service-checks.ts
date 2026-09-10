import { getPool } from './db';
import { validateCriticalEnvVars } from './envValidation';
import { startupMinIOInitialization } from './minio';
import type { ServiceInitializationResult, StartupResult, StartupServiceResult, StartupServiceStatus } from './startup-types';

const STARTUP_SERVICE_STATUSES: StartupServiceStatus[] = ['success', 'warning', 'error', 'skipped'];

export function getStartupErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function validateStartupEnvironment(): void {
  try {
    validateCriticalEnvVars();
  } catch (error) {
    console.error('Environment validation error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export function buildSkippedServiceInitializationResult(): ServiceInitializationResult {
  return {
    minio: { status: 'skipped', message: 'Build time - not initialized' },
    redis: { status: 'skipped', message: 'Build time - not initialized' },
  };
}

export async function initializeMinioService(): Promise<StartupResult['minio']> {
  const minioResult = await startupMinIOInitialization();

  return {
    status: normalizeServiceStatus(minioResult.status),
    message: minioResult.message,
    bucket: minioResult.bucket,
    error: 'error' in minioResult ? minioResult.error : undefined,
  };
}

export async function checkDatabaseConnection(): Promise<StartupResult['database']> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
    return {
      status: 'success',
      message: 'Database connection successful',
    };
  } finally {
    client.release();
  }
}

export function buildSkippedRedisResult(message: string): StartupResult['redis'] {
  return {
    status: 'skipped',
    message,
  };
}

export function calculateOverallStartupStatus(
  services: Pick<StartupResult, 'database' | 'redis' | 'minio'>,
): StartupResult['overall'] {
  const serviceResults: StartupServiceResult[] = [services.database, services.redis, services.minio];
  const successCount = serviceResults.filter((service) => service.status === 'success').length;
  const errorCount = serviceResults.filter((service) => service.status === 'error').length;

  if (errorCount === 0) {
    return 'ready';
  }

  return successCount > 0 ? 'partial' : 'failed';
}

function normalizeServiceStatus(status: string): StartupServiceStatus {
  return STARTUP_SERVICE_STATUSES.includes(status as StartupServiceStatus)
    ? (status as StartupServiceStatus)
    : 'error';
}
