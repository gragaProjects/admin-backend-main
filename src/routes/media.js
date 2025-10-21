require('dotenv').config(); // <--- add this line on top
const express = require('express');
const router = express.Router();

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path')

// Configure AWS S3 Client
// const s3Client = new S3Client({
//     region: 'ap-south-1',
//     credentials: {
//         accessKeyId: '',
//         secretAccessKey: ''
//     }
// });
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'text/csv',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        console.log(`File upload rejected - MIME type: ${file.mimetype}, Original name: ${file.originalname}`);
        const error = new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
      }
      cb(null, true);
    }
});
// Helper function to generate secure random filename
const generateSecureFilename = (originalname) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalname);
    return `${timestamp}-${randomString}${extension}`;
};

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided'
          }
        });
      }
  
      const file = req.file;
      const secureFilename = generateSecureFilename(file.originalname);
  
      // Prepare S3 upload parameters
      const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,   // ✅ from .env now
        //Bucket: `assisthealth-media`,
        Key: `uploads/${secureFilename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make sure your bucket policy allows this
        ServerSideEncryption: 'AES256' // Enable server-side encryption
      };
  
      // Upload to S3
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
  
      // Return success response
      res.status(200).json({
        success: true,
        imageUrl: `https://${ process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/uploads/${secureFilename}`,
        metadata: {
          fileName: secureFilename,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      });
  
    } catch (error) {
      console.error('Upload error:', error);
  
      // Handle specific error types
      if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: error.message,
            details: {
              allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'text/csv', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
            }
          }
        });
      }
  
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LIMIT_FILE_SIZE',
            message: 'File size exceeds limit',
            details: {
              maxSize: 10 * 1024 * 1024 // 10MB in bytes
            }
          }
        });
      }
  
      // Generic error response
      res.status(503).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload to storage service',
          details: {
            retryAfter: 30
          }
        }
      });
    }
});

//upload csv to s3 
router.post('/upload-csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: 'No file provided'
                }
            });
        }

        const file = req.file;
        const secureFilename = generateSecureFilename(file.originalname);

        // Prepare S3 upload parameters
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/${secureFilename}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
            ServerSideEncryption: 'AES256'
        };

        // Upload to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Return success response
        res.status(200).json({
            success: true,
            imageUrl: `https://${ process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/uploads/${secureFilename}`,
            metadata: {
                fileName: secureFilename,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Handle specific error types
        if (error.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: error.message,
                    details: {
                        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
                    }
                }
            });
        }

        // Generic error response
        res.status(503).json({
            success: false,
            error: {
                code: 'UPLOAD_FAILED',
                message: 'Failed to upload to storage service',
                details: {
                    retryAfter: 30
                }
            }
        });
    }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'LIMIT_FILE_SIZE',
                    message: 'File size exceeds limit',
                    details: {
                        maxSize: 10 * 1024 * 1024 // 10MB in bytes
                    }
                }
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'LIMIT_FILE_COUNT',
                    message: 'Too many files uploaded',
                    details: {
                        maxFiles: 1
                    }
                }
            });
        }
        
        return res.status(400).json({
            success: false,
            error: {
                code: 'MULTER_ERROR',
                message: error.message
            }
        });
    }
    
    // Pass other errors to the default error handler
    next(error);
});

module.exports = router;