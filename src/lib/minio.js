import { Client as Minio } from 'minio';
export const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME || process.env.MINIO_BUCKET || 'uploads';
export const MINIO_PUBLIC_BASE_URL = process.env.MINIO_PUBLIC_BASE_URL || 'http://localhost:9000';
export const minioClient = new Minio({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});
// Function to ensure bucket exists with enhanced configuration
export async function ensureBucketExists() {
    try {
        console.log(`Checking if MinIO bucket '${MINIO_BUCKET}' exists...`);
        const exists = await minioClient.bucketExists(MINIO_BUCKET);
        if (!exists) {
            console.log(`Bucket '${MINIO_BUCKET}' does not exist. Creating it...`);
            // Create the bucket
            await minioClient.makeBucket(MINIO_BUCKET);
            console.log(`✅ Successfully created MinIO bucket: ${MINIO_BUCKET}`);
            // Set bucket policy for public read access (optional)
            try {
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`]
                        }
                    ]
                };
                await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
                console.log(`✅ Set public read policy for bucket: ${MINIO_BUCKET}`);
            }
            catch (policyError) {
                console.warn(`⚠️ Could not set bucket policy (this is optional): ${policyError}`);
            }
            // Set bucket versioning (optional)
            try {
                await minioClient.setBucketVersioning(MINIO_BUCKET, { Status: 'Enabled' });
                console.log(`✅ Enabled versioning for bucket: ${MINIO_BUCKET}`);
            }
            catch (versioningError) {
                console.warn(`⚠️ Could not enable versioning (this is optional): ${versioningError}`);
            }
        }
        else {
            console.log(`✅ MinIO bucket '${MINIO_BUCKET}' already exists`);
        }
        // Test bucket access by listing objects
        await minioClient.listObjects(MINIO_BUCKET, '', true);
        console.log(`✅ Bucket '${MINIO_BUCKET}' is accessible and ready for use`);
        return {
            status: 'success',
            bucket: MINIO_BUCKET,
            message: 'Bucket is ready for uploads',
            created: !exists
        };
    }
    catch (error) {
        console.error('❌ Error ensuring MinIO bucket exists:', error);
        // Provide more specific error messages
        let errorMessage = 'Failed to initialize MinIO bucket';
        if (error instanceof Error) {
            if (error.message.includes('connect')) {
                errorMessage = 'Cannot connect to MinIO server. Please check if MinIO is running.';
            }
            else if (error.message.includes('Access Denied')) {
                errorMessage = 'Access denied. Please check MinIO credentials.';
            }
            else if (error.message.includes('NoSuchBucket')) {
                errorMessage = 'Bucket does not exist and could not be created.';
            }
            else {
                errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
    }
}
// Function to initialize MinIO with comprehensive setup
export async function initializeMinIO() {
    try {
        console.log('🚀 Initializing MinIO...');
        // Test connection first
        console.log('Testing MinIO connection...');
        await minioClient.listBuckets();
        console.log('✅ MinIO connection successful');
        // Ensure bucket exists
        const result = await ensureBucketExists();
        console.log('🎉 MinIO initialization completed successfully');
        return result;
    }
    catch (error) {
        console.error('❌ MinIO initialization failed:', error);
        throw error;
    }
}
// Function to get bucket info
export async function getBucketInfo() {
    try {
        const exists = await minioClient.bucketExists(MINIO_BUCKET);
        if (!exists) {
            return {
                exists: false,
                bucket: MINIO_BUCKET,
                message: 'Bucket does not exist'
            };
        }
        // Test bucket access by listing objects
        await minioClient.listObjects(MINIO_BUCKET, '', true);
        return {
            exists: true,
            bucket: MINIO_BUCKET,
            message: 'Bucket is accessible and ready for use'
        };
    }
    catch (error) {
        console.error('Error getting bucket info:', error);
        throw error;
    }
}
// Startup initialization function - call this when the app starts
export async function startupMinIOInitialization() {
    try {
        console.log('🚀 Starting MinIO initialization...');
        // Check if MinIO is available
        const isAvailable = await checkMinIOAvailability();
        if (!isAvailable) {
            console.warn('⚠️ MinIO is not available. File uploads will not work.');
            return {
                status: 'warning',
                message: 'MinIO is not available. File uploads will not work.',
                bucket: MINIO_BUCKET
            };
        }
        // Initialize MinIO
        const result = await initializeMinIO();
        console.log('✅ MinIO startup initialization completed');
        return result;
    }
    catch (error) {
        console.error('❌ MinIO startup initialization failed:', error);
        return {
            status: 'error',
            message: 'Failed to initialize MinIO during startup',
            error: error instanceof Error ? error.message : 'Unknown error',
            bucket: MINIO_BUCKET
        };
    }
}
// Function to check if MinIO is available
async function checkMinIOAvailability() {
    try {
        // Try to list buckets (this will fail if MinIO is not available)
        await minioClient.listBuckets();
        return true;
    }
    catch (error) {
        console.warn('MinIO is not available:', error);
        return false;
    }
}
// Auto-initialization on module load (optional - uncomment if you want automatic initialization)
// startupMinIOInitialization().catch(console.error); 
