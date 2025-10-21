require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const archiver = require('archiver');
const stream = require('stream');

class S3Service {
   constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY
        }
    });
    this.bucketName =process.env.AWS_BUCKET_NAME;
  }

  async createAndUploadZip(directoryPath) {
    const archive = archiver('zip');
    const passThrough = new stream.PassThrough();
    
    // List all files in directory
    const files = await this.listFiles(directoryPath);
    
    // Add files to zip
    for (const file of files) {
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: file.Key
      });
      
      const response = await this.s3Client.send(getCommand);
      archive.append(response.Body, { name: file.Key.split('/').pop() });
    }
    
    // Create zip file in S3
    const zipKey = `temp/${Date.now()}-archive.zip`;
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: zipKey,
      Body: passThrough
    });

    const uploadPromise = this.s3Client.send(uploadCommand);

    archive.pipe(passThrough);
    archive.finalize();

    await uploadPromise;

    // Generate presigned URL valid for 24 hours
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: zipKey
    });
    
    return getSignedUrl(this.s3Client, getCommand, { expiresIn: 86400 });
  }

  async listFiles(prefix) {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix.startsWith('/') ? prefix.slice(1) : prefix
    });

    const response = await this.s3Client.send(command);
    return response.Contents || [];
  }
}

module.exports = new S3Service(); 