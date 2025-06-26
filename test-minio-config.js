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

const minioClient = new Client(config);

async function testMinIO() {
  try {
    // Test 1: List buckets
    const buckets = await minioClient.listBuckets();
    
    // Test 2: Check if bucket exists
    const bucketExists = await minioClient.bucketExists(config.bucket);
    if (bucketExists) {
      // Test 4: List objects in bucket
      const objects = await minioClient.listObjects(config.bucket, '', true);
      const objectList = [];
      for await (const obj of objects) {
        objectList.push(obj.name);
      }
      
      // Test 5: Test upload (optional)
      const testData = Buffer.from('Hello MinIO!');
      const testFileName = `test-${Date.now()}.txt`;
      
      await minioClient.putObject(config.bucket, testFileName, testData);
      
      // Clean up test file
      await minioClient.removeObject(config.bucket, testFileName);
      
    } else {
      // Test 3: Create bucket
      await minioClient.makeBucket(config.bucket);
    }
    
  } catch (error) {
    // Provide helpful error messages
    if (error.message.includes('connect')) {
      // ... existing error handling code ...
    } else if (error.message.includes('Access Denied')) {
      // ... existing error handling code ...
    } else if (error.message.includes('NoSuchBucket')) {
      // ... existing error handling code ...
    }
    
    process.exit(1);
  }
}

// Run the test
testMinIO(); 