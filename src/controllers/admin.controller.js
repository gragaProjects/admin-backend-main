const { AuthCredential, Admin, Member, Doctor, Nurse, Navigator, EmpanelledDoctor, Appointment, Blog } = require('../models/index');
const { logger } = require('../utils/logger');

class UserController {
  /**
   * Get user profile based on user type
   */
  async getProfile(req, res) {
    try {
      const { userType, _id } = req.user;
      console.log(userType, _id);

      let authProfile = await AuthCredential.findOne({ _id }).select('-password -lastOtp');
      console.log(`authProfile: ${JSON.stringify(authProfile)}`);
      
      let userProfile;
      switch (userType) {
        case 'admin':
          userProfile = await Admin.findOne({ _id: authProfile.userId }).lean();
          break;
        case 'member':
          userProfile = await Member.findOne({ _id: authProfile.userId }).lean();
          break;
        case 'doctor':
          userProfile = await Doctor.findOne({ _id: authProfile.userId }).lean();
          break;
        case 'nurse':
          userProfile = await Nurse.findOne({ _id: authProfile.userId }).lean();
          break;
        case 'navigator':
          userProfile = await Navigator.findOne({ _id: authProfile.userId }).lean();
          break;
        default:
          break;
      }

      // Merge auth profile with user type profile
      userProfile = {
        ...authProfile.toObject(),
        ...userProfile
      };

      
      if (!userProfile) {
        return res.status(404).json({
          status: 'error',
          message: 'Profile not found'
        });
      }

      res.json({
        status: 'success',
        data: userProfile
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching profile'
      });
    }
  }

  async updateAdmin(req, res) {
    try {
      const userId = req.user._id;
      console.log(`userId: ${userId}`);

      // Verify user is admin
      const authProfile = await AuthCredential.findById(userId);
      if (authProfile.userType !== 'admin') {
        return res.status(403).json({
          status: 'error', 
          message: 'Only admin profiles can be updated through this endpoint'
        });
      }

      const { phone, dob, profilePic, ...otherFields } = req.body;

      // Check phone number uniqueness if being updated
      if (phone) {
        const existingPhone = await AuthCredential.findOne({
          _id: { $ne: userId },
          phone
        });

        if (existingPhone) {
          return res.status(400).json({
            status: 'error',
            message: 'Phone number already in use'
          });
        }
      }

      // Update AuthCredential fields
      if (phone) {
        await AuthCredential.findByIdAndUpdate(userId, { phoneNumber: phone });
      }

      // Update Admin fields with correct field mappings
      const adminUpdateFields = {
        ...otherFields,
        phone: phone || undefined,
        dob: dob ? new Date(dob) : undefined,  // Map dateOfBirth to dob
        profilePic: profilePic || undefined,  // Map profilePicture to profilePic
      };

      // Remove undefined values
      Object.keys(adminUpdateFields).forEach(key => 
        adminUpdateFields[key] === undefined && delete adminUpdateFields[key]
      );

      const profileUpdate = await Admin.findByIdAndUpdate(
        authProfile.userId,
        adminUpdateFields,
        { new: true }
      );

      if (!profileUpdate) {
        return res.status(404).json({
          status: 'error',
          message: 'Admin profile not found'
        });
      }

      res.json({
        status: 'success',
        data: profileUpdate
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating user'
      });
    }
  }

  async getStats(req, res) {
    try {
      let userId = req.user.userId;
      let userType = req.user.userType;
      let stats;
      
      switch (userType) {
        case 'admin':
          const navigators = await Navigator.find({}).countDocuments();
          const doctors = await Doctor.find({}).countDocuments();
          const nurses = await Nurse.find({}).countDocuments();
          
          // Updated queries for members, students and subprofiles
          const students = await Member.find({ isStudent: true }).countDocuments();
          const members = await Member.find({ isMember: true }).countDocuments();
          const subprofiles = await Member.find({ isSubprofile: true }).countDocuments();
          
          const empDoctors = await EmpanelledDoctor.find({}).countDocuments();
          const appointments = await Appointment.find({}).countDocuments();
          const blogs = await Blog.find({}).countDocuments();
          
          stats = {
            navigators,
            doctors,
            nurses,
            students,
            members,
            empDoctors,
            appointments,
            blogs,
            subprofiles
          };
          break;
        case 'navigator':
        break;
        case 'doctor':
        break;
        case 'nurse':
        break;
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
}

module.exports = new UserController(); 