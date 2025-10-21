const express = require('express');
const router = express.Router();
const excelService = require('../utils/excel');
const s3Service = require('../utils/s3');
const { Member } = require('../models');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Generate member report
router.get('/members/export', async (req, res) => {
  try {
    logger.info('Starting member report generation');

    const members = await Member.find({})
      .select('memberId name email phone dob gender')
      .lean();

    logger.debug(`Found ${members.length} members to export`);

    const filePath = await excelService.jsonToExcel(
      members,
      'Members Report'
    );

    logger.debug('Excel file generated', { filePath });

    const fileName = await s3Service.uploadFile({
      originalname: 'members_report.xlsx',
      buffer: fs.readFileSync(filePath),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileUrl = await s3Service.getSignedUrl(fileName);
    fs.unlinkSync(filePath);

    logger.info('Report generated and uploaded successfully', { fileName });

    res.json({
      message: 'Report generated successfully',
      fileUrl
    });
  } catch (error) {
    logger.error('Failed to generate report', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Bulk member import
router.post('/members/import', 
  s3Service.constructor.upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Save uploaded file temporarily
      const tempPath = path.join(__dirname, '..', '..', 'temp', req.file.originalname);
      fs.writeFileSync(tempPath, req.file.buffer);

      // Process bulk data
      const results = await excelService.processBulkData(
        tempPath,
        async (row) => {
          // Process each member
          await Member.create({
            memberId: row.memberId,
            name: row.name,
            email: row.email,
            phone: row.phone,
            dob: row.dob,
            gender: row.gender
          });
        },
        {
          validateRow: (row) => {
            if (!row.memberId || !row.name || !row.phone) {
              return 'MemberId, Name and Phone are required';
            }
            return null;
          }
        }
      );

      // Generate error report if there are failures
      let errorReportUrl = null;
      if (results.failed > 0) {
        const errorReportPath = await excelService.generateErrorReport(results.errors);
        const errorFileName = await s3Service.uploadFile({
          originalname: 'import_errors.xlsx',
          buffer: fs.readFileSync(errorReportPath),
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        errorReportUrl = await s3Service.getSignedUrl(errorFileName);
        fs.unlinkSync(errorReportPath);
      }

      // Clean up
      fs.unlinkSync(tempPath);

      res.json({
        message: 'Import completed',
        results,
        errorReportUrl
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: 'Error processing import' });
    }
  }
);

module.exports = router; 