const express = require('express');
const router = express.Router();
const s3Service = require('../utils/s3');

// Single file upload
router.post('/upload', 
  s3Service.constructor.upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileName = await s3Service.uploadFile(req.file);
      const fileUrl = await s3Service.getSignedUrl(fileName);

      res.json({
        message: 'File uploaded successfully  Test',
        fileName,
        fileUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  }
);

// Multiple files upload (max 5 files)
router.post('/upload-multiple',
  s3Service.constructor.upload.array('files', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadPromises = req.files.map(file => s3Service.uploadFile(file));
      const fileNames = await Promise.all(uploadPromises);

      const urlPromises = fileNames.map(fileName => s3Service.getSignedUrl(fileName));
      const fileUrls = await Promise.all(urlPromises);

      res.json({
        message: 'Files uploaded successfully',
        files: fileNames.map((fileName, index) => ({
          fileName,
          fileUrl: fileUrls[index]
        }))
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Error uploading files' });
    }
  }
);

module.exports = router; 