const { Navigator, Member, Doctor, Appointment, School, AuthCredential } = require('../models/index');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/email');
const mongoose = require('mongoose');
const pdfService = require('../utils/pdfService');

class NavigatorController {
  /**
   * Create new navigator
   */
  async createNavigator(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        languagesSpoken,
        introduction,
        profilePic
        
      } = req.body;

      // Check if navigator already exists
      const existingNavigator = await Navigator.findOne({
        $or: [{ email }, { phone }]
      });

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

      if (existingNavigator) {
        return res.status(400).json({
          status: 'error',
          message: 'Navigator already exists with this email or phone'
        });
      }

      // Create navigator
      const navigator = await Navigator.create({
        name,
        email,
        phone,
        dob,
        gender,
        languagesSpoken,
        introduction,
        profilePic
      });

      //generate and hash temporary password
      const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      console.log(`temporary password: ${temporaryPassword}`);

      //create a auth credential for the navigator
      const authCredential = await AuthCredential.create({
        userId: navigator._id,
        email,
        phoneNumber: phone,
        phone,
        password: null,
        userType: 'navigator',
        temporaryPassword: {
          password: hashedPassword,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day from now
        },
        isFirstLogin: true,
        passwordResetRequired: true
      });

      await authCredential.save();

      //send a welcome email to the navigator with the temporary password
       const toObj = {
        name: name,
        email: email
       }
       console.log(temporaryPassword);
       emailService.sendEmail('welcome_password', toObj, {
        temporaryPassword: temporaryPassword  // Send the plain temporary password, not the hashed one
       });


      res.status(201).json({
        status: 'success',
        data: navigator
      });
    } catch (error) {
      logger.error('Create navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating navigator'
      });
    }
  }

  /**
   * Get all navigators with filters
   */
  async getAllNavigators(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        gender,
        languages,
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Search by name, email, or phone
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          {navigatorId : {$regex: search, $options: 'i'}}
        ];
      }

      // Add gender filter
      if (gender) {
        query.gender = gender;
      }

      // Add languages filter - assuming languages comes as comma-separated string
      if (languages) {
        const languageArray = languages.split(',').map(lang => lang.trim());
        query.languagesSpoken = { $in: languageArray };
      }

      // Add rating filter
      if (rating) {
        // You can filter exact rating or use range
        // For exact rating:
        query.rating = parseFloat(rating);
        
        // Or for range (e.g., rating >= specified value)
        // query.rating = { $gte: parseFloat(rating) };
      }

      const navigators = await Navigator.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      const total = await Navigator.countDocuments(query);

      res.json({
        status: 'success',
        data: navigators,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get all navigators error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching navigators'
      });
    }
  }

  /**
   * Get navigator by ID
   */
  async getNavigator(req, res) {
    try {
      const navigator = await Navigator.findById(req.params.id)

      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      res.json({
        status: 'success',
        data: navigator
      });
    } catch (error) {
      logger.error('Get navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching navigator'
      });
    }
  }

  /**
   * Update navigator
   */
  async updateNavigator(req, res) {
    try {
      const {
        name,
        email,
        phone,
        dob,
        gender,
        languagesSpoken,
        introduction,
        profilePic,
        rating,
        total_assigned_members
      } = req.body;

      const navigator = await Navigator.findById(req.params.id);

      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      // Check if email or phone is being updated
      if (email || phone) {
        // Check if the new email/phone already exists for another navigator
        const existingNavigator = await Navigator.findOne({
          _id: { $ne: req.params.id }, // exclude current navigator
          $or: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        });

        if (existingNavigator) {
        return res.status(400).json({
          status: 'error', 
            message: 'Email or phone number already exists for another navigator'
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

        // Update AuthCredential if email or phone is changing
        const authCredential = await AuthCredential.findOne({ 
          userId: req.params.id,
          userType: 'navigator'
        });

        if (!authCredential) {
          // If no AuthCredential exists, create one
          const temporaryPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

          const newAuthCredential = await AuthCredential.create({
            userId: req.params.id,
            email: email || navigator.email,
            phoneNumber: phone || navigator.phone,
            phone: phone || navigator.phone,
            password: null,
            userType: 'navigator',
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
            name: navigator.name,
            email: email || navigator.email
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
               name: navigator.name,
               email: email
             }
             emailService.sendEmail('welcome_password', toObj, {
               password: temporaryPassword
             });
           }

           await AuthCredential.findOneAndUpdate(
             { 
               userId: req.params.id,
               userType: 'navigator'
             },
             updateData,
             { runValidators: true }
           );
         }
      }

      const updatedNavigator = await Navigator.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(dob && { dob }),
          ...(gender && { gender }),
          ...(languagesSpoken && { languagesSpoken }), 
          ...(introduction && { introduction }),
          ...(profilePic && { profilePic }),
          ...(rating !== undefined && { rating }),
          ...(total_assigned_members !== undefined && { total_assigned_members })
        },
        { 
          new: true,
          upsert: false,
          runValidators: true // This ensures enum validation for gender
        }
      );

      res.json({
        status: 'success',
        data: updatedNavigator
      });
    } catch (error) {
      logger.error('Update navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating navigator'
      });
    }
  }

  /**
   * Get navigator's assigned members
   */
  async getNavigatorMembers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
      
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {
        'healthcareTeam.navigator._id': req.params.id
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } }
        ];
      }

      if (schoolId) {
        query.schoolId = schoolId;
      }

      const members = await Member.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('schoolId', 'name');

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
      logger.error('Get navigator members error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching members'
      });
    }
  }

  async deleteNavigator(req, res) {
    try {
      const navigator = await Navigator.findByIdAndDelete(req.params.id);
      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      // Check if nurse has any assigned members
      const assignedMembers = await Member.countDocuments({
        'healthcareTeam.navigator._id': req.params.id
      });

      if (assignedMembers > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete navigator with assigned members. Please reassign members first.'
        });
      }

      await Navigator.findByIdAndDelete(req.params.id);

      await AuthCredential.findOneAndDelete({ userId: new mongoose.Types.ObjectId(req.params.id) });

      res.json({
        status: 'success',
        message: 'Navigator deleted successfully'
      });
    } catch (error) {
      logger.error('Delete navigator error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting navigator'
      });
    }
  }

  async getNavigatorStats(req, res) {
    try {

      let userId = req.user.userId;
      console.log(`userId: ${userId}`);
      let userType = req.user.userType;
      console.log(`userType: ${userType}`);
      let stats, members, doctors, appointments, pending, ongoing, completed, newMembers;
      if(userType === 'navigator') {
        members = await Member.find({isStudent: false, 'healthcareTeam.navigator._id': new mongoose.Types.ObjectId(userId)}).countDocuments();
        doctors = await Doctor.find({navigatorId: new mongoose.Types.ObjectId(userId)}).countDocuments();
        appointments = await Appointment.find({navigatorId: new mongoose.Types.ObjectId(userId)}).countDocuments();
        pending = await Appointment.find({navigatorId: new mongoose.Types.ObjectId(userId), status: 'pending'}).countDocuments();
        ongoing = await Appointment.find({navigatorId: new mongoose.Types.ObjectId(userId), status: 'ongoing'}).countDocuments();
        completed = await Appointment.find({navigatorId: new mongoose.Types.ObjectId(userId), status: 'completed'}).countDocuments();
        newMembers = await Member.find({
          isStudent: false,
          $or: [
            { 'healthcareTeam.navigator': { $exists: false } },
            { 'healthcareTeam.navigator': null },
            { 'healthcareTeam.navigator._id': { $exists: false } }
          ]
        }).countDocuments();
      }
       
      stats = {
        members,
        doctors,
        appointments,
        pending,
        ongoing,
        completed,
        newMembers
      };

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
   * Generate navigator profile PDF
   */
  async generateProfile(req, res) {
    try {
      const navigator = await Navigator.findById(req.params.id);
      if (!navigator) {
        return res.status(404).json({
          status: 'error',
          message: 'Navigator not found'
        });
      }

      const result = await pdfService.generateNavigatorProfilePdf(navigator, res);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Navigator profile generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error generating navigator profile'
      });
    }
  }
}

module.exports = new NavigatorController(); 