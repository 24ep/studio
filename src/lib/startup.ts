import { startupMinIOInitialization } from './minio';
import { getPool } from './db';

export interface StartupResult {
  minio: {
    status: 'success' | 'warning' | 'error';
    message: string;
    bucket?: string;
    error?: string;
  };
  database: {
    status: 'success' | 'error';
    message: string;
    error?: string;
  };
  overall: 'ready' | 'partial' | 'failed';
}

export async function initializeApplication(): Promise<StartupResult> {
  const result: StartupResult = {
    minio: { status: 'error', message: 'Not initialized' },
    database: { status: 'error', message: 'Not initialized' },
    overall: 'failed'
  };
  
  // Initialize MinIO
  try {
    const minioResult = await startupMinIOInitialization();
    result.minio = {
      status: minioResult.status as 'success' | 'warning' | 'error',
      message: minioResult.message,
      bucket: minioResult.bucket,
      error: 'error' in minioResult ? minioResult.error : undefined
    };
  } catch (error) {
    result.minio = {
      status: 'error',
      message: 'Failed to initialize MinIO',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Test database connection
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    result.database = {
      status: 'success',
      message: 'Database connection successful'
    };
  } catch (error) {
    result.database = {
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Determine overall status
  if (result.database.status === 'success' && result.minio.status === 'success') {
    result.overall = 'ready';
  } else if (result.database.status === 'success' && (result.minio.status === 'warning' || result.minio.status === 'error')) {
    result.overall = 'partial';
  } else {
    result.overall = 'failed';
  }
  
  return result;
}

// Function to check if application is ready
export async function isApplicationReady(): Promise<boolean> {
  try {
    const result = await initializeApplication();
    return result.overall === 'ready';
  } catch (error) {
    return false;
  }
}

// Auto-initialization on module load (optional)
// initializeApplication().catch(console.error); 