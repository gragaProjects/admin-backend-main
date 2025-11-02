require('dotenv').config(); // Load environment variables
const express = require('express');
const router = express.Router();

const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname).replace('.', '');
    const filename = `${timestamp}-${randomString}.${extension}`;

    return {
      folder: 'assisthealth/uploads', // You can change folder name
      public_id: filename,
      resource_type: 'auto', // auto-detect (image, video, pdf, etc.)
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'xlsx', 'csv', 'txt']
    };
  },
});

// ✅ Multer setup with limits and filters
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      console.log(`❌ Invalid file type: ${file.mimetype}`);
      const error = new Error(`Invalid file type: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  },
});

// ✅ Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file provided' },
      });
    }

    res.status(200).json({
      success: true,
      imageUrl: req.file.path,
      fileUrl: req.file.path,
      metadata: {
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: error.message,
        },
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_FILE_SIZE',
          message: 'File size exceeds 10MB limit',
        },
      });
    }

    res.status(503).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload to Cloudinary',
      },
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