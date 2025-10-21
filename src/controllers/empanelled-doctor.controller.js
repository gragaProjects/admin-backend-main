const { EmpanelledDoctor, HealthcareProvider, AuthCredential } = require('../models');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Create new empanelled doctor
exports.createDoctor = async (req, res) => {
  try {
    

    const existingAuthCredential = await AuthCredential.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingAuthCredential) {
      return res.status(400).json({
        status: 'error',
        message: `${existingAuthCredential.userType} already exists with this email or phone`
      });
    }

    // Validate that all provider IDs exist before creating doctor
    if (req.body.workplaces && req.body.workplaces.length > 0) {
      for (const workplace of req.body.workplaces) {
        const provider = await HealthcareProvider.findById(workplace.providerId);
        if (!provider) {
          return res.status(400).json({
            status: 'error',
            message: `Healthcare provider with ID ${workplace.providerId} not found`
          });
        }
        // Add provider details to workplace
        workplace.name = provider.name;
        workplace.type = provider.type;
      }
    }
    
    // Create the doctor with validated workplace data
    const doctor = await EmpanelledDoctor.create(req.body);
    
    // Populate the healthcare provider details
    await doctor.populate('workplaces.providerId', 'name type');
    
    logger.info('New empanelled doctor created', { doctorId: doctor.empanelledDoctorId });
    
    res.status(201).json({
      status: 'success',
      data: doctor
    });
  } catch (err) {
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `Duplicate ${field}. This ${field} is already in use.`
      });
    }

    // Handle other errors
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get all empanelled doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      speciality,
      specializedIn,
      gender,
      providerId,
      provider,
      minExperience,
      maxExperience,
      day,
      timeFrom,
      timeTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    logger.info('Received query params:', { 
      providerId, 
      provider,
      search,
      speciality,
      gender 
    });

    const query = {};
    
    // Search by name, email, phone, or empanelledDoctorId
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { empanelledDoctorId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add filters if provided
    if (speciality) {
      query.speciality = { $regex: speciality, $options: 'i' };
    }
    
    if (specializedIn) {
      query.specializedIn = { $regex: specializedIn, $options: 'i' };
    }

    if (gender) {
      query.gender = gender.toLowerCase();
    }

    // Validate providerId if provided (support both providerId and provider)
    const providerIdToUse = providerId || provider;
    if (providerIdToUse) {
      logger.info('Attempting to validate provider ID:', providerIdToUse);
      
      if (!mongoose.Types.ObjectId.isValid(providerIdToUse)) {
        logger.warn('Invalid provider ID format:', providerIdToUse);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid provider ID format. Please provide a valid ID.'
        });
      }

      try {
        // Check if the provider exists
        const providerExists = await HealthcareProvider.findById(providerIdToUse).select('name type');
        
        if (!providerExists) {
          logger.warn('Provider not found:', providerIdToUse);
          return res.status(404).json({
            status: 'error',
            message: 'Provider not found with the given ID'
          });
        }

        logger.info('Provider found:', { id: providerIdToUse, name: providerExists.name });
        query['workplaces.providerId'] = new mongoose.Types.ObjectId(providerIdToUse);
        
      } catch (error) {
        logger.error('Database error while checking provider:', {
          error: error.message,
          stack: error.stack,
          providerId: providerIdToUse
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Database error while validating provider',
          details: process.env.NODE_ENV === 'development' ? {
            error: error.message,
            providerId: providerIdToUse
          } : undefined
        });
      }
    }

    // Experience range filter
    if (minExperience !== undefined || maxExperience !== undefined) {
      query.experienceInYrs = {};
      if (minExperience !== undefined) {
        const minExp = parseInt(minExperience);
        if (isNaN(minExp)) {
          return res.status(400).json({
            status: 'error',
            message: 'minExperience must be a valid number'
          });
        }
        query.experienceInYrs.$gte = minExp;
      }
      if (maxExperience !== undefined) {
        const maxExp = parseInt(maxExperience);
        if (isNaN(maxExp)) {
          return res.status(400).json({
            status: 'error',
            message: 'maxExperience must be a valid number'
          });
        }
        query.experienceInYrs.$lte = maxExp;
      }
    }

    // Time slot filters
    if (day || timeFrom || timeTo) {
      const timeSlotQuery = {};
      
      if (day) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const normalizedDay = day.toLowerCase();
        if (!validDays.includes(normalizedDay)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid day. Must be one of: ' + validDays.join(', ')
          });
        }
        timeSlotQuery['workplaces.timeSlots.day'] = normalizedDay;
      }

      if (timeFrom) {
        // Basic time format validation (HH:MM)
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeFrom)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid timeFrom format. Please use HH:MM format (e.g., 09:00)'
          });
        }
        timeSlotQuery['workplaces.timeSlots.from'] = { $lte: timeFrom };
      }

      if (timeTo) {
        // Basic time format validation (HH:MM)
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeTo)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid timeTo format. Please use HH:MM format (e.g., 17:00)'
          });
        }
        timeSlotQuery['workplaces.timeSlots.to'] = { $gte: timeTo };
      }

      // Combine time slot conditions with existing query
      if (Object.keys(timeSlotQuery).length > 0) {
        query.$and = query.$and || [];
        query.$and.push(timeSlotQuery);
      }
    }

    // Calculate skip value for pagination
    const sanitizedPage = Math.max(1, parseInt(page) || 1);
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    // Validate sortBy field
    const allowedSortFields = ['createdAt', 'name', 'experienceInYrs', 'rating'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sortBy field. Allowed fields: ' + allowedSortFields.join(', ')
      });
    }

    // Create sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    logger.info('Executing find query with:', { query, sort, skip, limit: sanitizedLimit });
    
    const doctors = await EmpanelledDoctor.find(query)
      .populate('workplaces.providerId', 'name type')
      .sort(sort)
      .skip(skip)
      .limit(sanitizedLimit);

    // Get total count for pagination
    const total = await EmpanelledDoctor.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: doctors.length,
      total,
      totalPages: Math.ceil(total / sanitizedLimit),
      currentPage: sanitizedPage,
      data: doctors
    });
  } catch (err) {
    logger.error('Error in getAllDoctors:', {
      error: err.message,
      stack: err.stack,
      query: req.query
    });
    
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching doctors',
      details: process.env.NODE_ENV === 'development' ? {
        error: err.message,
        query: req.query
      } : undefined
    });
  }
};

// Get single empanelled doctor
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await EmpanelledDoctor.findById(req.params.id)
      .populate('workplaces.providerId', 'name type');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No empanelled doctor found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: doctor
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update empanelled doctor
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await EmpanelledDoctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('workplaces.providerId', 'name type');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No empanelled doctor found with that ID'
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
    
    logger.info('Empanelled doctor updated', { doctorId: doctor.empanelledDoctorId });
    
    res.status(200).json({
      status: 'success',
      data: doctor
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Delete empanelled doctor
exports.deleteDoctor = async (req, res) => {
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid doctor ID format'
      });
    }

    const doctor = await EmpanelledDoctor.findByIdAndDelete(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No empanelled doctor found with that ID'
      });
    }
    
    logger.info('Empanelled doctor deleted', { doctorId: doctor.empanelledDoctorId });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}; 