require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
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

  // Generate unique filename
  generateFileName(originalname) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalname.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  // Upload file to S3
  async uploadFile(file) {
    try {
      const fileName = this.generateFileName(file.originalname);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      return fileName;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  //upload pdf to s3
  async uploadPdf(buffer, fileName) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: 'application/pdf',
      ACL: 'public-read'  // Make the object publicly readable
    });

    await this.s3Client.send(command);
    
    // Return a direct S3 URL that never expires
    const pdfUrl = `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    return pdfUrl;
  }

  // Get signed URL for file download
  async getSignedUrl(fileName, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(fileName) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  }

  // Multer middleware for handling file uploads
  static upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images and PDFs only
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
      }
    },
  });

  async listFiles(prefix) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix.startsWith('/') ? prefix.slice(1) : prefix
      });

      const response = await this.s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('S3 list files error:', error);
      throw error;
    }
  }

  async createAndUploadZip(directoryPath) {
    try {
      const archive = archiver('zip');
      const passThrough = new stream.PassThrough();
      
      // List all files in directory
      const files = await this.listFiles(directoryPath);
      console.log(`files: ${JSON.stringify(files)}`);
      
      if (!files.length) {
        throw new Error('No files found in the specified directory');
      }

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

      // Generate presigned URL
      return this.getSignedUrl(zipKey, 86400); // 24 hours expiry
    } catch (error) {
      console.error('S3 zip creation error:', error);
      throw error;
    }
  }

  //download file from s3
  async downloadFile(fileUrl) {
    console.log(`fileUrl: ${fileUrl}`);
    const fileName = fileUrl.split('/').pop();
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: `uploads/${fileName}`
    });

    const response = await this.s3Client.send(command);
    return response.Body;
  }
}

module.exports = new S3Service(); 