const { School, Member, Navigator, Nurse } = require('../models');
const { logger } = require('../utils/logger');

class SchoolController {
  /**
   * Create new school
   */
  async createSchool(req, res) {
    try {
      const {
        name,
        logo,
        description,
        address,
        contactNumber,
        email,
        website,
        grades,
        principal,
        isActive
      } = req.body;

      // Check if school already exists
      const existingSchool = await School.findOne({
        $or: [{ email }, { contactNumber }]
      });

      if (existingSchool) {
        return res.status(400).json({
          status: 'error',
          message: 'School already exists with this email or contact number'
        });
      }

      // Create school with updated fields
      const school = await School.create({
        name,
        logo,
        description,
        address,
        contactNumber,
        email,
        website,
        grades,
        principal,
        isActive
      });

      res.status(201).json({
        status: 'success',
        data: school
      });
    } catch (error) {
      logger.error('Create school error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating school'
      });
    }
  }

  /**
   * Get all schools with filters
   */
  async getAllSchools(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        pinCode,
        isActive,
        sortBy = 'name',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Search by name, email, schoolId or contact number
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } },
          { schoolId: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by pinCode
      if (pinCode) {
        query['address.pinCode'] = pinCode;
      }

      // Filter by active status
      if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true';
      }

      const schools = await School.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await School.countDocuments(query);

      res.json({
        status: 'success',
        data: schools,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get all schools error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching schools'
      });
    }
  }

  /**
   * Get school by ID with staff and student counts
   */
  async getSchool(req, res) {
    try {
      const school = await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          status: 'error',
          message: 'School not found'
        });
      }

      // Get counts
      const [studentCount, navigatorCount, nurseCount] = await Promise.all([
        Member.countDocuments({ schoolId: req.params.id, isStudent: true }),
        Navigator.countDocuments({ schoolIds: req.params.id }),
        Nurse.countDocuments({ schoolId: req.params.id })
      ]);

      res.json({
        status: 'success',
        data: {
          ...school.toObject(),
          stats: {
            studentCount,
            navigatorCount,
            nurseCount
          }
        }
      });
    } catch (error) {
      logger.error('Get school error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching school'
      });
    }
  }

  /**
   * Update school
   */
  async updateSchool(req, res) {
    try {
      const {
        name,
        logo,
        description,
        address,
        contactNumber,
        email,
        website,
        grades,
        principal,
        isActive
      } = req.body;

      const school = await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          status: 'error',
          message: 'School not found'
        });
      }

      // Check if email or contact number is already in use
      if (email || contactNumber) {
        const existingSchool = await School.findOne({
          _id: { $ne: req.params.id },
          $or: [
            { email: email || school.email },
            { contactNumber: contactNumber || school.contactNumber }
          ]
        });

        if (existingSchool) {
          return res.status(400).json({
            status: 'error',
            message: 'Email or contact number already in use'
          });
        }
      }

      const updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(logo && { logo }),
          ...(description && { description }),
          ...(address && { address }),
          ...(contactNumber && { contactNumber }),
          ...(email && { email }),
          ...(website && { website }),
          ...(grades && { grades }),
          ...(principal && { principal }),
          ...(typeof isActive !== 'undefined' && { isActive })
        },
        { new: true }
      );

      res.json({
        status: 'success',
        data: updatedSchool
      });
    } catch (error) {
      logger.error('Update school error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating school'
      });
    }
  }

  /**
   * Get school staff
   */
  async getSchoolStaff(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        search,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      let staffQuery;
      let Model;

      switch (type) {
        case 'navigator':
          Model = Navigator;
          staffQuery = { schoolIds: req.params.id };
          break;
        case 'nurse':
          Model = Nurse;
          staffQuery = { schoolId: req.params.id };
          break;
        default:
          return res.status(400).json({
            status: 'error',
            message: 'Invalid staff type'
          });
      }

      if (search) {
        staffQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const staff = await Model.find(staffQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Model.countDocuments(staffQuery);

      res.json({
        status: 'success',
        data: staff,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get school staff error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching school staff'
      });
    }
  }

  async deleteSchool(req, res) {
    try {
      const school = await School.findByIdAndDelete(req.params.id);
      if (!school) {
        return res.status(404).json({
          status: 'error',
          message: 'School not found'
        });
      }
      res.json({
        status: 'success',
        message: 'School deleted successfully'
      });
    } catch (error) {
      logger.error('Delete school error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting school'
      });
    }
  } 
}

module.exports = new SchoolController(); 