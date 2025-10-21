const { Assessment, Member, School } = require('../models');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const pdfService = require('../utils/pdfService');
const s3Service = require('../utils/s3');

class AssessmentController {
  /**
   * Create new assessment
   */
  async createAssessment(req, res) {
    try {
      const {
        studentId,
        schoolId,
        name,
        heightInFt,
        heightInCm,
        weightInKg,
        bmi,
        temperatureInCelsius,
        temperatureInFahrenheit,
        pulseRateBpm,
        spo2Percentage,
        bp,
        oralHealth,
        dentalIssues,
        visionLeft,
        visionRight,
        visionComments,
        hearingComments,
        additionalComments,
        doctorSignature,
        nurseSignature,
        guardianSignature
      } = req.body;

      // Verify student exists
      const member = await Member.findOne({ _id: new mongoose.Types.ObjectId(studentId), isStudent: true });
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found or not a valid student'
        });
      }

      // Create assessment
      const assessment = await Assessment.create({
        studentId,
        schoolId,
        name,
        heightInFt,
        heightInCm,
        weightInKg,
        bmi,
        temperatureInCelsius,
        temperatureInFahrenheit,
        pulseRateBpm,
        spo2Percentage,
        bp,
        oralHealth,
        dentalIssues,
        visionLeft,
        visionRight,
        visionComments,
        hearingComments,
        additionalComments,
        doctorSignature,
        nurseSignature,
        guardianSignature
      });

      // Populate student details
      await assessment.populate('studentId', 'name email');

      res.status(201).json({
        status: 'success',
        data: assessment
      });

      //generate assessmnt pdf and upload to s3
      const pdfObj = await pdfService.generateAssessmentPdf(assessment, res);
      console.log(`pdfObj: ${JSON.stringify(pdfObj)}`);
      const pdfUrl = pdfObj.s3Url;
      console.log(`successfully generated assessment pdf: ${pdfUrl}`);

      //updte this assessment by adding the pdf url
      await Assessment.findByIdAndUpdate(assessment._id, { pdfUrl: pdfUrl });
      console.log(`successfully updated assessment with pdf url: ${pdfUrl}`);
    } catch (error) {
      logger.error('Create assessment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating assessment'
      });
    }
  }

  /**
   * Get all assessments with filters
   */
  async getAllAssessments(req, res) {
    try {
      const {
        page = 1,
        limit = 100,
        studentId,
        schoolId,
        oralHealth,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Filter by student
      if (studentId) {
        query['studentId'] = new mongoose.Types.ObjectId(studentId);
      }

      if (schoolId) {
        query['schoolId'] = new mongoose.Types.ObjectId(schoolId);
      }

      // Filter by oral health
      if (oralHealth) {
        query.oralHealth = oralHealth;
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      console.log(query);
      const assessments = await Assessment.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('studentId', 'name email');

      const total = await Assessment.countDocuments(query);

      res.json({
        status: 'success',
        data: assessments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get assessments error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching assessments'
      });
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(req, res) {
    try {
      const assessment = await Assessment.findById(req.params.id)
        .populate('studentId', 'name email')
        .populate('schoolId', 'name');

      if (!assessment) {
        return res.status(404).json({
          status: 'error',
          message: 'Assessment not found'
        });
      }

      // Check access permission
      // if (
      //   req.user.userType !== 'admin' &&
      //   req.user.userType !== 'doctor' &&
      //   req.user._id.toString() !== assessment.studentId._id.toString()
      // ) {
      //   return res.status(403).json({
      //     status: 'error',
      //     message: 'You do not have permission to view this assessment'
      //   });
      // }

      res.json({
        status: 'success',
        data: assessment
      });
    } catch (error) {
      logger.error('Get assessment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching assessment'
      });
    }
  }

  /**
   * Get assessment PDF by ID
   */
  async getAssessmentPdf(req, res) {
    try {
      const { studentId, schoolId, grade, section } = req.body;
      
      if (!schoolId) {
        return res.status(400).json({
          status: 'error',
          message: 'School ID is required'
        });
      }

      let s3Path = `/assessment/${schoolId}`;
      
      // Build S3 path based on provided filters
      if (studentId) {
        s3Path = `/assessment/${schoolId}/${grade}/${section}/${studentId}`;
      } else if (grade && section) {
        s3Path = `/assessment/${schoolId}/${grade}/${section}`;
      } else if (grade) {
        s3Path = `/assessment/${schoolId}/${grade}`;
      }

      console.log(`s3Path: ${s3Path}`);
      try {
        const zipFileUrl = await s3Service.createAndUploadZip(s3Path);

        res.json({
          status: 'success',
          data: {
            downloadUrl: zipFileUrl,
            expiresIn: '24 hours'
          }
        });
      } catch (s3Error) {
        logger.error('S3 operation error:', s3Error);
        return res.status(500).json({
          status: 'error',
          message: s3Error.message === 'No files found in the specified directory' 
            ? 'No assessment files found' 
            : 'Error processing PDF files'
        });
      }

    } catch (error) {
      logger.error('Get assessment PDF error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error generating PDF download'
      });
    }
  }

  /**
   * Update assessment
   */
  async updateAssessment(req, res) {
    try {
      const {
        name,
        heightInFt,
        weightInKg,
        bmi,
        temperatureInCelsius,
        temperatureInFahrenheit,
        pulseRateBpm,
        spo2Percentage,
        bp,
        oralHealth,
        dentalIssues,
        visionLeft,
        visionRight,
        hearingComments,
        additionalComments,
        doctorSignature,
        nurseSignature,
        guardianSignature
      } = req.body;

      const assessment = await Assessment.findById(req.params.id);

      if (!assessment) {
        return res.status(404).json({
          status: 'error',
          message: 'Assessment not found'
        });
      }

      const updatedAssessment = await Assessment.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(heightInFt && { heightInFt }),
          ...(weightInKg && { weightInKg }),
          ...(bmi && { bmi }),
          ...(temperatureInCelsius && { temperatureInCelsius }),
          ...(temperatureInFahrenheit && { temperatureInFahrenheit }),
          ...(pulseRateBpm && { pulseRateBpm }),
          ...(spo2Percentage && { spo2Percentage }),
          ...(bp && { bp }),
          ...(oralHealth && { oralHealth }),
          ...(dentalIssues && { dentalIssues }),
          ...(visionLeft && { visionLeft }),
          ...(visionRight && { visionRight }),
          ...(hearingComments && { hearingComments }),
          ...(additionalComments && { additionalComments }),
          ...(doctorSignature && { doctorSignature }),
          ...(nurseSignature && { nurseSignature }),
          ...(guardianSignature && { guardianSignature })
        },
        { new: true }
      ).populate('studentId', 'name email');

      res.json({
        status: 'success',
        data: updatedAssessment
      });

      //generate assessmnt pdf and upload to s3
      const pdfObj = await pdfService.generateAssessmentPdf(updatedAssessment, res);
      console.log(`pdfObj: ${JSON.stringify(pdfObj)}`);
      const pdfUrl = pdfObj.s3Url;
      console.log(`successfully generated assessment pdf: ${pdfUrl}`);

      //updte this assessment by adding the pdf url
      await Assessment.findByIdAndUpdate(updatedAssessment._id, { pdfUrl: pdfUrl });
      console.log(`successfully updated assessment with pdf url: ${pdfUrl}`);

    } catch (error) {
      logger.error('Update assessment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating assessment'
      });
    }
  }

  /**
   * Get member's assessment history
   */
  async getMemberAssessments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        oralHealth,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {
        studentId: req.params.memberId
      };

      if (oralHealth) {
        query.oralHealth = oralHealth;
      }

      const assessments = await Assessment.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Assessment.countDocuments(query);

      res.json({
        status: 'success',
        data: assessments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get member assessments error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching member assessments'
      });
    }
  }

  /**
   * Delete assessment by ID
   */
  async deleteAssessment(req, res) {
    try {
      const assessment = await Assessment.findById(req.params.id);

      if (!assessment) {
        return res.status(404).json({
          status: 'error',
          message: 'Assessment not found'
        });
      }

      // Optional: Add permission check if needed
      // if (
      //   req.user.userType !== 'admin' &&
      //   req.user._id.toString() !== assessment.studentId.toString()
      // ) {
      //   return res.status(403).json({
      //     status: 'error',
      //     message: 'You do not have permission to delete this assessment'
      //   });
      // }

      await Assessment.findByIdAndDelete(req.params.id);

      res.json({
        status: 'success',
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      logger.error('Delete assessment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting assessment'
      });
    }
  }

  //bulk upload assessments from csv
  async bulkUploadAssessments(req, res) {
    try {
      const { fileUrl, doctorSignature, nurseSignature } = req.body;

      const csvData = await s3Service.downloadFile(fileUrl);
      // Convert stream to string before logging
      const csvString = await new Promise((resolve, reject) => {
        const chunks = [];
        csvData.on('data', chunk => chunks.push(chunk));
        csvData.on('end', () => resolve(Buffer.concat(chunks).toString()));
        csvData.on('error', reject);
      });
      
      // Call validateBulkAssessmentCsv as a static method
      const validatedData = await AssessmentController.prototype.validateBulkAssessmentCsv(csvString);
      console.log(`validatedData: ${JSON.stringify(validatedData)}`);
      if (validatedData.status === 'error') {
        return res.status(400).json(validatedData);
      }

      //get the school from the database
      console.log(`schoolId: ${validatedData.data.rows[0][validatedData.data.headers.schoolId]}`);
      const school = await School.findOne({schoolId: validatedData.data.rows[0][validatedData.data.headers.schoolId]});
      if (!school) {
        return res.status(400).json({
          status: 'error',
          message: 'School not found'
        });
      }
      const schoolId = school._id;
      // Access the rows from validatedData.data
      const assessments = [];
      for (const row of validatedData.data.rows) {

        console.log(`studentId: ${row[validatedData.data.headers.studentId]}`);
        //get the student from the database
        const student = await Member.findOne({memberId: row[validatedData.data.headers.studentId]});
        console.log(`student: ${JSON.stringify(student)}`);
        if (!student) {
          return res.status(400).json({
            status: 'error',
            message: 'Student not found'
          });
        }
        const assessment = {
          studentId: student._id,
          schoolId: schoolId,
          name: row[validatedData.data.headers.name],
          heightInFt: row[validatedData.data.headers.heightInFt] || 
            (row[validatedData.data.headers.heightInCm] ? (row[validatedData.data.headers.heightInCm] / 30.48) : null),
          heightInCm: row[validatedData.data.headers.heightInCm] || null,
          weightInKg: row[validatedData.data.headers.weightInKg] || null,
          bmi: row[validatedData.data.headers.bmi] || 
            (row[validatedData.data.headers.weightInKg] && row[validatedData.data.headers.heightInCm] ? 
              (row[validatedData.data.headers.weightInKg] / ((row[validatedData.data.headers.heightInCm]/100) * (row[validatedData.data.headers.heightInCm]/100))).toFixed(2) : null),
          temperatureInCelsius: row[validatedData.data.headers.temperatureInCelsius] || null,
          temperatureInFahrenheit: row[validatedData.data.headers.temperatureInFahrenheit] || null,
          pulseRateBpm: row[validatedData.data.headers.pulseRateBpm] || null,
          spo2Percentage: row[validatedData.data.headers.spo2Percentage] || null,
          bp: row[validatedData.data.headers.bp] || null,
          oralHealth: row[validatedData.data.headers.oralHealth] || null,
          dentalIssues: row[validatedData.data.headers.dentalIssues] || null,
          visionLeft: row[validatedData.data.headers.visionLeft] || null,
          visionRight: row[validatedData.data.headers.visionRight] || null,
          hearingComments: row[validatedData.data.headers.hearingComments] || null,
          additionalComments: row[validatedData.data.headers.additionalComments] || null,
          doctorSignature: doctorSignature || null,
          nurseSignature: nurseSignature || null
        };
        assessments.push(assessment);
      }

      //push all assessments to the database
      const createdAssessments = await Assessment.insertMany(assessments);

      res.json({
        status: 'success',
        message: 'Assessments uploaded successfully'
      });

      //create a pdf for each assessment  
      for (const assessment of createdAssessments) {

        //generate assessmnt pdf and upload to s3
        const pdfObj = await pdfService.generateAssessmentPdf(assessment, res);
        console.log(`pdfObj: ${JSON.stringify(pdfObj)}`);
        if(pdfObj.success) {
          const pdfUrl = pdfObj.s3Url;
          console.log(`successfully generated assessment pdf: ${pdfUrl}`);

          //updte this assessment by adding the pdf url
          await Assessment.findByIdAndUpdate(assessment._id, { pdfUrl: pdfUrl });
          console.log(`successfully updated assessment with pdf url: ${pdfUrl}`);
        }
      }
      
    } catch (error) {
      logger.error('Bulk upload assessments error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error uploading assessments'
      });
    }
  }

  //validate bulk assessment csv
  async validateBulkAssessmentCsv(csvString) {
    try {
      // Split CSV into rows and remove any empty rows
      const rows = csvString.split('\n').filter(row => row.trim());
      if (rows.length < 2) { // At least header + 1 data row
        return {
          status: 'error',
          message: 'CSV file is empty or contains only headers'
        };
      }

      // Parse headers and trim whitespace
      const headers = rows[0].split(',').map(header => header.trim());
      
      // Parse data rows and trim whitespace from each cell
      const data = rows.slice(1).map(row => 
        row.split(',').map(cell => cell.trim())
      );

      // Required headers check
      const requiredHeaders = [
        'studentId', 'schoolId', 'name', 'heightInFt', 'heightInCm', 
        'weightInKg', 'bmi', 'temperatureInCelsius', 'temperatureInFahrenheit', 
        'pulseRateBpm', 'spo2Percentage', 'bp', 'oralHealth', 'dentalIssues', 
        'visionLeft', 'visionRight', 'hearingComments', 'additionalComments'
      ];

      const missingHeaders = requiredHeaders.filter(header => 
        !headers.includes(header)
      );

      if (missingHeaders.length > 0) {
        return {
          status: 'error',
          message: 'Required headers are missing',
          missingHeaders
        };
      }

      // Get column indexes for each field
      const headerIndexes = requiredHeaders.reduce((acc, header) => {
        acc[header] = headers.indexOf(header);
        return acc;
      }, {});

      // Validate students exist
      const studentIds = [...new Set(data.map(row => 
        row[headerIndexes.studentId]
      ))];
      console.log(`studentIds: ${JSON.stringify(studentIds)}`);

      const existingStudents = await Member.find({
        memberId: { $in: studentIds },
        isStudent: true
      });

      //check if there are any students that are not present in the database
      const invalidStudentIds = studentIds.filter(studentId => !existingStudents.some(student => student.memberId === studentId));
      if (invalidStudentIds.length > 0) {
        return {
          status: 'error',
          message: 'Some students are not present in the database',
          invalidStudentIds
        }
      }

      // Validate school exists and is consistent
      const schoolId = data[0][headerIndexes.schoolId];
      
      const school = await School.findOne({schoolId: schoolId});
      if (!school) {
        return {
          status: 'error',
          message: 'Invalid school ID',
          schoolId
        };
      }

      const inconsistentSchools = data.filter(row => 
        row[headerIndexes.schoolId] !== schoolId
      );

      if (inconsistentSchools.length > 0) {
        return {
          status: 'error',
          message: 'All records must belong to the same school',
          expectedSchoolId: schoolId,
          inconsistentRows: inconsistentSchools.map((row, index) => ({
            rowNumber: index + 2,
            foundSchoolId: row[headerIndexes.schoolId]
          }))
        };
      }

      return {
        status: 'success',
        message: 'CSV data is valid',
        data: {
          headers: headerIndexes,
          rows: data,
          schoolId,
          studentCount: data.length
        }
      };
    } catch (error) {
      logger.error('CSV validation error:', error);
      return {
        status: 'error',
        message: 'Error validating CSV data',
        error: error.message
      };
    }
  }
}

module.exports = new AssessmentController(); 