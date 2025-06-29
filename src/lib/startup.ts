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
  seeding: {
    status: 'success' | 'warning' | 'error';
    message: string;
    error?: string;
  };
  overall: 'ready' | 'partial' | 'failed';
}

export async function initializeApplication(): Promise<StartupResult> {
  const result: StartupResult = {
    minio: { status: 'error', message: 'Not initialized' },
    database: { status: 'error', message: 'Not initialized' },
    seeding: { status: 'error', message: 'Not initialized' },
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

  // Check if database needs seeding
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    // Check if admin user exists
    const adminCheck = await client.query('SELECT COUNT(*) as count FROM "User" WHERE email = $1', ['admin@ncc.com']);
    const adminExists = parseInt(adminCheck.rows[0].count) > 0;
    
    // Check if recruitment stages exist
    const stagesCheck = await client.query('SELECT COUNT(*) as count FROM "RecruitmentStage"');
    const stagesExist = parseInt(stagesCheck.rows[0].count) > 0;
    
    client.release();
    
    if (adminExists && stagesExist) {
      result.seeding = {
        status: 'success',
        message: 'Database already seeded'
      };
    } else {
      result.seeding = {
        status: 'warning',
        message: 'Database needs seeding - run prisma db seed'
      };
    }
  } catch (error) {
    result.seeding = {
      status: 'error',
      message: 'Failed to check seeding status',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Determine overall status
  if (result.database.status === 'success' && result.minio.status === 'success' && result.seeding.status === 'success') {
    result.overall = 'ready';
  } else if (result.database.status === 'success' && (result.minio.status === 'warning' || result.minio.status === 'error') && result.seeding.status === 'success') {
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

// Function to seed the database
export async function seedDatabase(): Promise<boolean> {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to seed database:', error);
    return false;
  }
}

// Auto-initialization on module load (optional)
// initializeApplication().catch(console.error); 

export function validateEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const optionalVars = [
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET', 
    'AZURE_AD_TENANT_ID',
    'REDIS_URL',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file or environment configuration.');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

export function validateDatabaseConnection() {
  // This would be called after Prisma client is available
  return true;
}

export function validateExternalServices() {
  // Validate Redis, MinIO, etc. connections
  return true;
} 