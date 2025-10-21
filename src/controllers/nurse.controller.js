const { Nurse, Member, School, AuthCredential, Assessment, Infirmary, Navigator } = require('../models');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/email');
const mongoose = require('mongoose');
const pdfService = require('../utils/pdfService');

class NurseController {

  /**
   * Get nurse stats
   */
  async getNurseStats(req, res) {
    try {

      let userId = req.user.userId;
      console.log(`userId: ${userId}`);
      let userType = req.user.userType;
      console.log(`userType: ${userType}`);
      let stats = {};
      if(userType === 'nurse') {
        // First get the nurse's assigned school
        const nurse = await Nurse.findById(userId).populate('schoolId', 'name schoolId');
        console.log('Nurse data:', nurse);
        
        // Initialize counts
        let students = 0;
        let assessments = 0;
        let infirmaries = 0;
        let schoolInfo = null;

        if (nurse && nurse.schoolId) {
          // Count all students in the nurse's assigned school
          // Get the school ID, handling both populated and unpopulated cases
          const schoolId = nurse.schoolId ? (nurse.schoolId.schoolId || nurse.schoolId) : null;
          console.log('School ID from nurse:', schoolId);

          students = await Member.find({
            isStudent: true,
            'studentDetails.schoolId': schoolId
          }).countDocuments();

          // Log the full query and a sample student for debugging
          console.log('Students query:', {
            isStudent: true,
            'studentDetails.schoolId': schoolId
          });
          
          const sampleStudent = await Member.findOne({
            isStudent: true,
            'studentDetails.schoolId': schoolId
          });
          console.log('Sample student:', sampleStudent ? {
            id: sampleStudent._id,
            schoolId: sampleStudent.studentDetails.schoolId
          } : 'No students found');

          // Set school info
          schoolInfo = {
            id: nurse.schoolId._id,
            name: nurse.schoolId.name
          };
        }

        // Get other counts
        assessments = await Assessment.find({nurseId: new mongoose.Types.ObjectId(userId)}).countDocuments();
        infirmaries = await Infirmary.find({nurseId: new mongoose.Types.ObjectId(userId)}).countDocuments();

        stats = {
          students,
          assessments,
          infirmaries,
          school: schoolInfo
        };
      }

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching stats'
      });
    }
    
  }

  /**
   * Create new nurse
   */
  async createNurse(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        schoolId,
        languagesSpoken,
        introduction
      } = req.body;

      // Check if nurse already exists
      const existingNurse = await Nurse.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingNurse) {
        return res.status(400).json({
          status: 'error',
          message: 'Nurse already exists with this email or phone'
        });
      }

      //also we need to check this navigator email in the auth credential
      const existingAuthCredential = await AuthCredential.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingAuthCredential) {
        return res.status(400).json({
          status: 'error',
          message: `${existingAuthCredential.userType} already exists with this email or phone`
        });
      }

      // Validate school
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: 'error',
          message: 'School not found'
        });
      }

      // Create nurse with updated fields
      const nurse = await Nurse.create({
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        schoolId,
        schoolAssigned: !!schoolId, // Set to true if schoolId is provided
        languagesSpoken,
        introduction
      });

      //generate and hash temporary password
      const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      console.log(`temporary password: ${temporaryPassword}`);

      //create a auth credential for the navigator
      const authCredential = await AuthCredential.create({
        userId: nurse._id,
        email,
        phoneNumber: phone,
        phone,
        password: null,
        userType: 'nurse',
        temporaryPassword: {
          password: hashedPassword,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day from now
        },
        isFirstLogin: true,
        passwordResetRequired: true
      });

      await authCredential.save();

      //send a welcome email to the nurse with the temporary password
      const toObj = {
        name: name,
        email: email
      }
      emailService.sendEmail('welcome_password', toObj, {
        temporaryPassword: temporaryPassword  // Send the plain temporary password, not the hashed one
      });


      res.status(201).json({
        status: 'success',
        data: nurse
      });
    } catch (error) {
      logger.error('Create nurse error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating nurse'
      });
    }
  }

  /**
   * Get all nurses with filters
   */
  async getAllNurses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        schoolId,
        gender,
        languages,
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Search by name, email, phone, or nurseId
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { nurseId: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by school
      if (schoolId) {
        query.schoolId = schoolId;
      }

      // Add gender filter
      if (gender) {
        query.gender = gender;
      }

      // Add languages filter
      if (languages) {
        const languageArray = languages.split(',').map(lang => lang.trim());
        query.languagesSpoken = { $in: languageArray };
      }

      // Add rating filter
      if (rating) {
        // For exact rating
        query.rating = parseFloat(rating);
        
      }

      const nurses = await Nurse.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('schoolId', 'name');

      const total = await Nurse.countDocuments(query);

      res.json({
        status: 'success',
        data: nurses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get all nurses error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching nurses'
      });
    }
  }

  /**
   * Get nurse by ID
   */
  async getNurse(req, res) {
    try {
      const nurse = await Nurse.findById(req.params.id)
        .populate('schoolId', 'name')
        .populate('navigatorId', 'name profilePic navigatorId');

      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      res.json({
        status: 'success',
        data: nurse
      });
    } catch (error) {
      logger.error('Get nurse error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching nurse'
      });
    }
  }

  /**
   * Update nurse
   */
  async updateNurse(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        profilePic,
        schoolId,
        languagesSpoken,
        introduction
      } = req.body;

      const nurse = await Nurse.findById(req.params.id);

      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      // Check if email or phone is already in use
      if (email || phone) {
        const existingNurse = await Nurse.findOne({
          _id: { $ne: req.params.id },
          $or: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        });

        if (existingNurse) {
          return res.status(400).json({
            status: 'error',
            message: 'Email or phone number already in use'
          });
        }

        const existingAuthCredential = await AuthCredential.findOne({
          $or: [{ email }, { phone }]
        });
  
        if (existingAuthCredential) {
          return res.status(400).json({
            status: 'error',
            message: `${existingAuthCredential.userType} already exists with this email or phone`
          });
        }
        
        // Find AuthCredential
        const authCredential = await AuthCredential.findOne({ 
          userId: req.params.id,
          userType: 'nurse'
        });

        if (!authCredential) {
          // If no AuthCredential exists, create one
          const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

          const newAuthCredential = await AuthCredential.create({
            userId: req.params.id,
            email: email || nurse.email,
            phoneNumber: phone || nurse.phone,
            phone: phone || nurse.phone,
            password: null,
            userType: 'nurse',
            temporaryPassword: {
              password: hashedPassword,
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day from now
            },
            isFirstLogin: true,
            passwordResetRequired: true
          });

          await newAuthCredential.save();

          // Send welcome email with temporary password
          const toObj = {
            name: nurse.name,
            email: email || nurse.email
          }
          emailService.sendEmail('welcome_password', toObj, {
            password: temporaryPassword
          });
        } else {
          // Update existing AuthCredential
          const updateData = {
            ...(phone && { phone, phoneNumber: phone })
          };

          // If email is changing, update email and set new temporary password
          if (email) {
            const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

            updateData.email = email;
            updateData.password = null;
            updateData.temporaryPassword = {
              password: hashedPassword,
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day from now
            };
            updateData.isFirstLogin = false;
            updateData.passwordResetRequired = true;

            // Send email with new temporary password
            const toObj = {
              name: nurse.name,
              email: email
            }
            emailService.sendEmail('welcome_password', toObj, {
              password: temporaryPassword
            });
          }

          await AuthCredential.findOneAndUpdate(
            { 
              userId: req.params.id,
              userType: 'nurse'
            },
            updateData,
            { runValidators: true }
          );
        }
      }

      const updateFields = {};
      
      // Handle all fields including null values
      if ('name' in req.body) updateFields.name = name;
      if ('email' in req.body) updateFields.email = email;
      if ('phone' in req.body) updateFields.phone = phone;
      if ('dob' in req.body) updateFields.dob = dob;
      if ('gender' in req.body) updateFields.gender = gender;
      if ('profilePic' in req.body) updateFields.profilePic = profilePic;
      if ('languagesSpoken' in req.body) updateFields.languagesSpoken = languagesSpoken;
      if ('introduction' in req.body) updateFields.introduction = introduction;
      
      // handling for schoolId 
      if ('schoolId' in req.body) {
        updateFields.schoolId = schoolId;
        updateFields.schoolAssigned = true;
      }

      const updatedNurse = await Nurse.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      ).populate('schoolId', 'name');

      res.json({
        status: 'success',
        data: updatedNurse
      });
    } catch (error) {
      logger.error('Update nurse error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating nurse'
      });
    }
  }

  /**
   * Get nurse's assigned members
   */
  async getNurseMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {
        'healthcareTeam.nurse._id': req.params.id
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } }
        ];
      }

      const members = await Member.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Member.countDocuments(query);

      res.json({
        status: 'success',
        data: members,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get nurse members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching members'
      });
    }
  }


  //asign navigator to nurse
  async assignNavigator(req, res) {
    try {
      const { navigatorId, nurseId } = req.body;

      const nurse = await Nurse.findById(nurseId);
      const navigator = await Navigator.findById(navigatorId);

      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      nurse.navigatorId = new mongoose.Types.ObjectId(navigatorId);
      nurse.navigatorAssigned = true;
      await nurse.save();

      res.json({
        status: 'success',
        message: 'Navigator assigned to nurse successfully'
      });
    } catch (error) {
      logger.error('Assign navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error assigning navigator to nurse'
      });
    }
  }

  /**
   * Delete nurse
   */
  async deleteNurse(req, res) {
    try {
      const nurse = await Nurse.findById(req.params.id);

      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      // Check if nurse has any assigned members
      const assignedMembers = await Member.countDocuments({
        'healthcareTeam.nurse._id': req.params.id
      });

      if (assignedMembers > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete nurse with assigned members. Please reassign members first.'
        });
      }

      await Nurse.findByIdAndDelete(req.params.id);

      await AuthCredential.findOneAndDelete({ userId: new mongoose.Types.ObjectId(req.params.id) });

      res.json({
        status: 'success',
        message: 'Nurse deleted successfully'
      });
    } catch (error) {
      logger.error('Delete nurse error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting nurse'
      });
    }
  }

  /**
   * Generate nurse profile PDF
   */
  async generateProfile(req, res) {
    try {
      const nurse = await Nurse.findById(req.params.id)
        .populate('schoolId', 'name');
        
      if (!nurse) {
        return res.status(404).json({
          status: 'error',
          message: 'Nurse not found'
        });
      }

      const result = await pdfService.generateNurseProfilePdf(nurse, res);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Nurse profile generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error generating nurse profile'
      });
    }
  }
}

module.exports = new NurseController(); 