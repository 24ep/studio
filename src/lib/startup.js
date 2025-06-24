import { startupMinIOInitialization } from './minio';
import { getPool } from './db';
export async function initializeApplication() {
    console.log('🚀 Starting application initialization...');
    const result = {
        minio: { status: 'error', message: 'Not initialized' },
        database: { status: 'error', message: 'Not initialized' },
        overall: 'failed'
    };
    // Initialize MinIO
    try {
        console.log('📦 Initializing MinIO...');
        const minioResult = await startupMinIOInitialization();
        result.minio = {
            status: minioResult.status,
            message: minioResult.message,
            bucket: minioResult.bucket,
            error: 'error' in minioResult ? minioResult.error : undefined
        };
        console.log(`✅ MinIO: ${minioResult.message}`);
    }
    catch (error) {
        console.error('❌ MinIO initialization failed:', error);
        result.minio = {
            status: 'error',
            message: 'Failed to initialize MinIO',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    // Test database connection
    try {
        console.log('🗄️ Testing database connection...');
        const pool = getPool();
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        result.database = {
            status: 'success',
            message: 'Database connection successful'
        };
        console.log('✅ Database: Connection successful');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        result.database = {
            status: 'error',
            message: 'Failed to connect to database',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    // Determine overall status
    if (result.database.status === 'success' && result.minio.status === 'success') {
        result.overall = 'ready';
    }
    else if (result.database.status === 'success' && (result.minio.status === 'warning' || result.minio.status === 'error')) {
        result.overall = 'partial';
    }
    else {
        result.overall = 'failed';
    }
    console.log(`🎯 Application initialization ${result.overall}:`);
    console.log(`   Database: ${result.database.status} - ${result.database.message}`);
    console.log(`   MinIO: ${result.minio.status} - ${result.minio.message}`);
    return result;
}
// Function to check if application is ready
export async function isApplicationReady() {
    try {
        const result = await initializeApplication();
        return result.overall === 'ready';
    }
    catch (error) {
        console.error('Failed to check application readiness:', error);
        return false;
    }
}
// Auto-initialization on module load (optional)
// initializeApplication().catch(console.error); 
