#!/usr/bin/env node

/**
 * Test script to verify MinIO configuration
 * Run this script to check if MinIO is properly configured and accessible
 */

const { Client } = require('minio');

// Configuration from docker-compose.yml
const config = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio_secret_password',
  bucket: process.env.MINIO_BUCKET_NAME || 'canditrack-resumes'
};

console.log('🔍 Testing MinIO Configuration...');
console.log('Configuration:', {
  endPoint: config.endPoint,
  port: config.port,
  useSSL: config.useSSL,
  accessKey: config.accessKey,
  bucket: config.bucket
});

const minioClient = new Client(config);

async function testMinIO() {
  try {
    console.log('\n📡 Testing MinIO connection...');
    
    // Test 1: List buckets
    console.log('1. Listing buckets...');
    const buckets = await minioClient.listBuckets();
    console.log('✅ Successfully connected to MinIO');
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // Test 2: Check if bucket exists
    console.log('\n2. Checking bucket existence...');
    const bucketExists = await minioClient.bucketExists(config.bucket);
    if (bucketExists) {
      console.log(`✅ Bucket '${config.bucket}' exists`);
    } else {
      console.log(`⚠️ Bucket '${config.bucket}' does not exist`);
      
      // Test 3: Create bucket
      console.log('\n3. Creating bucket...');
      await minioClient.makeBucket(config.bucket);
      console.log(`✅ Successfully created bucket '${config.bucket}'`);
    }
    
    // Test 4: List objects in bucket
    console.log('\n4. Listing objects in bucket...');
    const objects = await minioClient.listObjects(config.bucket, '', true);
    const objectList = [];
    for await (const obj of objects) {
      objectList.push(obj.name);
    }
    console.log(`✅ Bucket contains ${objectList.length} objects`);
    if (objectList.length > 0) {
      console.log('Sample objects:', objectList.slice(0, 5));
    }
    
    // Test 5: Test upload (optional)
    console.log('\n5. Testing upload capability...');
    const testData = Buffer.from('Hello MinIO!');
    const testFileName = `test-${Date.now()}.txt`;
    
    await minioClient.putObject(config.bucket, testFileName, testData);
    console.log(`✅ Successfully uploaded test file: ${testFileName}`);
    
    // Clean up test file
    await minioClient.removeObject(config.bucket, testFileName);
    console.log(`✅ Cleaned up test file: ${testFileName}`);
    
    console.log('\n🎉 All MinIO tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   Endpoint: ${config.endPoint}:${config.port}`);
    console.log(`   Bucket: ${config.bucket}`);
    console.log(`   SSL: ${config.useSSL}`);
    console.log(`   Access Key: ${config.accessKey}`);
    
  } catch (error) {
    console.error('\n❌ MinIO test failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('connect')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check if MinIO is running');
      console.log('   - Verify the endpoint and port');
      console.log('   - Ensure MinIO is accessible from this machine');
    } else if (error.message.includes('Access Denied')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check MinIO credentials (access key and secret key)');
      console.log('   - Verify MINIO_ROOT_USER and MINIO_ROOT_PASSWORD in docker-compose.yml');
    } else if (error.message.includes('NoSuchBucket')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - The bucket does not exist and could not be created');
      console.log('   - Check MinIO permissions');
    }
    
    process.exit(1);
  }
}

// Run the test
testMinIO(); 