
const { Client } = require('minio');
require('dotenv').config({ path: '.env' });

const minioClient = new Client({
    endPoint: (process.env.MINIO_ENDPOINT || 'localhost').replace('http://', '').replace('https://', '').split(':')[0],
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET_NAME || process.env.MINIO_BUCKET || 'studio-2';
const objectName = 'profile-images/1755863194405-54724dec-e530-41e5-a067-6b63ff9d967b.jfif';

console.log(`Checking if object exists: ${objectName} in bucket ${bucketName}`);
console.log(`Endpoint: ${process.env.MINIO_ENDPOINT}, Port: ${process.env.MINIO_PORT}`);

minioClient.statObject(bucketName, objectName)
    .then(stat => console.log('Success:', stat))
    .catch(err => console.log('Error:', err));
