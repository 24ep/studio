import { validateCriticalEnvVars } from './envValidation';
import {
  buildSkippedRedisResult,
  buildSkippedServiceInitializationResult,
  calculateOverallStartupStatus,
  checkDatabaseConnection,
  getStartupErrorMessage,
  initializeMinioService,
  isProductionBuildPhase,
  validateStartupEnvironment,
} from './startup-service-checks';
import { seedApplicationDatabase, seedPrismaDatabase } from './startup-seeding';
import type { ServiceInitializationResult, StartupResult } from './startup-types';

export type { StartupResult } from './startup-types';

export async function initializeServices(): Promise<ServiceInitializationResult> {
  if (isProductionBuildPhase()) {
    return buildSkippedServiceInitializationResult();
  }

  validateStartupEnvironment();

  const results: ServiceInitializationResult = {
    minio: { status: 'error', message: 'Not initialized' },
    redis: { status: 'error', message: 'Not initialized' },
  };

  try {
    const minioResult = await initializeMinioService();
    results.minio = {
      status: minioResult.status,
      message: minioResult.message,
    };
  } catch (error) {
    results.minio = {
      status: 'error',
      message: `Failed to initialize MinIO: ${getStartupErrorMessage(error)}`,
    };
  }

  results.redis = buildSkippedRedisResult('Redis initialization skipped');

  return results;
}

export async function initializeApplication(): Promise<StartupResult> {
  const result: StartupResult = {
    minio: { status: 'error', message: 'Not initialized' },
    database: { status: 'error', message: 'Not initialized' },
    redis: { status: 'error', message: 'Not initialized' },
    seeding: { status: 'error', message: 'Not initialized' },
    overall: 'failed',
  };

  try {
    result.minio = await initializeMinioService();
  } catch (error) {
    console.error('MinIO initialization failed:', error);
    result.minio = {
      status: 'error',
      message: 'Failed to initialize MinIO',
      error: getStartupErrorMessage(error),
    };
  }

  try {
    result.database = await checkDatabaseConnection();
  } catch (error) {
    console.error('Database connection failed:', error);
    result.database = {
      status: 'error',
      message: 'Failed to connect to database',
      error: getStartupErrorMessage(error),
    };
  }

  result.redis = buildSkippedRedisResult('Redis connection skipped');

  if (result.database.status === 'success') {
    result.seeding = seedApplicationDatabase();
  } else {
    result.seeding = {
      status: 'error',
      message: 'Cannot seed database - database connection failed',
    };
  }

  result.overall = calculateOverallStartupStatus(result);

  return result;
}

export async function isApplicationReady(): Promise<boolean> {
  try {
    const result = await initializeApplication();
    return result.overall === 'ready';
  } catch (error) {
    return false;
  }
}

export async function seedDatabase(): Promise<boolean> {
  return seedPrismaDatabase();
}

if (!isProductionBuildPhase()) {
  initializeServices().catch(console.error);
}

export function validateEnvironmentVariables() {
  try {
    validateCriticalEnvVars();
    return true;
  } catch (error) {
    console.error('Environment variable validation failed:', error);
    return false;
  }
}

export function validateDatabaseConnection() {
  return true;
}

export function validateExternalServices() {
  return true;
}
