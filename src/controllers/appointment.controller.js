const { Appointment, Doctor, Member, Notification } = require('../models');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const pdfService = require('../utils/pdfService');
const s3Service = require('../utils/s3');

class AppointmentController {
  /**
   * Create new appointment
   */
  async createAppointment(req, res) {
    try {
      const {
        memberId,
        doctorId,
        navigatorId,
        appointedBy,
        appointmentDateTime,
        specialization,
        hospitalName,
        hospitalAddress,
        status = 'pending',
        service,
        memberAddress,
        appointmentType = 'offline',
        additionalInfo,
        notes,
        payment = 'pending'
      } = req.body;

      // Check if doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          status: 'error',
          message: 'Doctor not found'
        });
      }

      // Check if member exists
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      // Check if slot is available
      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDateTime,
        status: { $nin: ['cancelled', 'completed'] }
      });

      if (existingAppointment) {
        return res.status(400).json({
          status: 'error',
          message: 'This time slot is already booked'
        });
      }

      if(navigatorId == null){ 
        let member = await Member.findOne({_id: mongoose.Types.ObjectId(memberId)});
        navigatorId = member.healthcareTeam.navigator._id;
      }
      // Create appointment without prescription
      let appointment = await Appointment.create({
        memberId,
        doctorId,
        navigatorId,
        appointedBy,
        appointmentDateTime,
        status,
        specialization,
        hospitalName,
        hospitalAddress,
        service,
        memberAddress,
        appointmentType,
        additionalInfo,
        notes,
        payment
      });

      // Create notifications
      await Notification.create([
        {
          userId: doctorId,
          title: 'New Appointment',
          message: `You have a new ${appointmentType} appointment scheduled`,
          type: 'appointment_created'
        },
        {
          userId: memberId,
          title: 'Appointment Scheduled',
          message: `Your ${appointmentType} appointment has been scheduled`,
          type: 'appointment_created'
        }
      ]);

      res.status(201).json({
        status: 'success',
        data: appointment
      });

    } catch (error) {
      logger.error('Create appointment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating appointment',
        details: error.message
      });
    }
  }

  /**
   * Get all appointments with filters and search
   */
  async getAllAppointments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        startDate,
        endDate,
        doctorId,
        memberId,
        navigatorId,
        search,
        hospitalName,
        service,
        payment,
        sortBy = 'appointmentDateTime',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Global search across multiple fields
      if (search) {
        query.$or = [
          { hospitalName: { $regex: search, $options: 'i' } },
          { hospitalAddress: { $regex: search, $options: 'i' } },
          { service: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
          { memberId: { $regex: search, $options: 'i' } },
          {memberIdname: { $regex: search, $options: 'i' }},
          {memberIdemail: { $regex: search, $options: 'i' }},
          {memberIdphone: { $regex: search, $options: 'i' }}
        ];
      }

      // Apply specific filters
      if (status) {
        query.status = status;
      }
      
      if (type) {
        query.appointmentType = type;
      }

      if (payment) {
        query.payment = payment;
      }

      if (hospitalName) {
        query.hospitalName = { $regex: hospitalName, $options: 'i' };
      }

      if (service) {
        query.service = { $regex: service, $options: 'i' };
      }

      // ID filters with validation
      if (doctorId) {
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid doctor ID format'
          });
        }
        query.doctorId = new mongoose.Types.ObjectId(doctorId);
      }

      if (memberId) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid member ID format'
          });
        }
        query.memberId = new mongoose.Types.ObjectId(memberId);
      }

      if (navigatorId) {
        if (!mongoose.Types.ObjectId.isValid(navigatorId)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid navigator ID format'
          });
        }
        query.navigatorId = new mongoose.Types.ObjectId(navigatorId);
      }

      // Date range filter with validation
      if (startDate || endDate) {
        query.appointmentDateTime = {};
        
        if (startDate) {
          const startDateObj = new Date(startDate);
          if (isNaN(startDateObj.getTime())) {
            return res.status(400).json({
              status: 'error',
              message: 'Invalid start date format'
            });
          }
          query.appointmentDateTime.$gte = startDateObj;
        }
        
        if (endDate) {
          const endDateObj = new Date(endDate);
          if (isNaN(endDateObj.getTime())) {
            return res.status(400).json({
              status: 'error',
              message: 'Invalid end date format'
            });
          }
          query.appointmentDateTime.$lte = endDateObj;
        }
      }

      // Validate and sanitize pagination parameters
      const sanitizedPage = Math.max(1, parseInt(page) || 1);
      const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
      const skip = (sanitizedPage - 1) * sanitizedLimit;

      // Validate sort parameters
      const allowedSortFields = ['appointmentDateTime', 'status', 'createdAt', 'hospitalName', 'service'];
      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`
        });
      }

      // Create sort object
      const sort = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1
      };

      logger.info('Executing appointment search with query:', { query, sort, skip, limit: sanitizedLimit });

      const appointments = await Appointment.find(query)
        .sort(sort)
        .skip(skip)
        .limit(sanitizedLimit)
        .populate('doctorId', 'doctorId name email phone qualification profilePic')
        .populate('memberId', 'memberId name email phone profilePic')
        .populate('navigatorId', 'navigatorId name profilePic')
        .lean()
        .then(appointments => {
          return appointments.map(appointment => ({
            ...appointment,
            appointmentDTLocal: new Date(appointment.appointmentDateTime).toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              weekday: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }).replace(/(\d+)(?=(st|nd|rd|th))/, (match, day) => {
              const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || day > 13) ? 0 : day % 10];
              return `${day}${suffix}`;
            })
          }));
        });

      const total = await Appointment.countDocuments(query);

      res.json({
        status: 'success',
        data: appointments,
        pagination: {
          total,
          page: sanitizedPage,
          pages: Math.ceil(total / sanitizedLimit),
          limit: sanitizedLimit
        }
      });
    } catch (error) {
      logger.error('Get all appointments error:', {
        error: error.message,
        stack: error.stack,
        query: req.query
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Error fetching appointments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctorId', 'doctorId name email phone qualification profilePic')
        .populate('memberId', 'memberId name email phone profilePic')
        .populate('navigatorId', 'navigatorId name profilePic')
        .lean()
        .then(appointment => {
          if (appointment) {
            return {
              ...appointment,
              appointmentDTLocal: new Date(appointment.appointmentDateTime).toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }).replace(/(\d+)(?=(st|nd|rd|th))/, (match, day) => {
                const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || day > 13) ? 0 : day % 10];
                return `${day}${suffix}`;
              })
            };
          }
          return null;
        });

      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }

      res.json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      logger.error('Get appointment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching appointment'
      });
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(req, res) {
    try {
      const {
        appointmentDateTime,
        appointedBy,
        status,
        service,
        memberAddress,
        hospitalName,
        hospitalAddress,
        appointmentType,
        additionalInfo,
        notes,
        prescription,
        payment,
        doctorId,
        memberId,
        navigatorId
      } = req.body;

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }

      // Validate status transition if status is being updated
      if (status && status !== appointment.status) {
        const validTransitions = {
          pending: ['ongoing', 'cancelled', 'completed'],
          ongoing: ['completed', 'cancelled'],
          completed: [],
          cancelled: []
        };

        if (!validTransitions[appointment.status].includes(status)) {
          return res.status(400).json({
            status: 'error',
            message: `Cannot transition from ${appointment.status} to ${status}`
          });
        }
      }

      if(doctorId){
        const doctor = await Doctor.findById(doctorId);
        if(!doctor){
          return res.status(404).json({
            status: 'error',
            message: 'Doctor not found'
          });
        }
      }

      
      // Prepare update object by copying all fields from req.body except restricted ones
      const updateData = { ...req.body };
      delete updateData.memberId;  // Prevent updating memberId
      delete updateData.navigatorId;  // Prevent updating navigatorId

      // Special handling for prescription if it exists
      if (updateData.prescription) {
        updateData.prescription = {
          chiefComplaints: updateData.prescription.chiefComplaints,
          allergies: updateData.prescription.allergies,
          history: updateData.prescription.history,
          diagnosis: updateData.prescription.diagnosis,
          medicines: updateData.prescription.medicines?.map(medicine => ({
            name: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            investigations: medicine.investigations,
            treatmentPlan: medicine.treatmentPlan
          })),
          additionalInstructions: updateData.prescription.additionalInstructions
        };
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      // Create notifications for status update
      if (status && status !== appointment.status) {
        await Notification.create([
          {
            userId: appointment.doctorId,
            title: 'Appointment Update',
            message: `Appointment status updated to ${status}`,
            type: 'appointment_updated'
          },
          {
            userId: appointment.memberId,
            title: 'Appointment Update',
            message: `Your appointment status has been updated to ${status}`,
            type: 'appointment_updated'
          }
        ]);
      }


      res.json({
        status: 'success',
        data: updatedAppointment
      });

    } catch (error) {
      logger.error('Update appointment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating appointment',
        details: error.message
      });
    }
  }

  /**
   * Update appointment prescription
   */
  async updatePrescription(req, res) {
    try {
      const {
        chiefComplaints,
        allergies,
        history,
        diagnosis,
        medicines,
        additionalInstructions
      } = req.body;

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }

      if (appointment.status !== 'completed') {
        return res.status(400).json({
          status: 'error',
          message: 'Can only add prescription to completed appointments'
        });
      }

      appointment.prescription = {
        chiefComplaints,
        allergies,
        history,
        diagnosis,
        medicines,
        additionalInstructions
      };

      await appointment.save();

      // Create notification for member
      await Notification.create({
        userId: appointment.memberId,
        title: 'Prescription Added',
        message: 'Your doctor has added a prescription',
        type: 'prescription_added'
      });

      res.json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      logger.error('Update prescription error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating prescription'
      });
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(req, res) {
    try {
      const { status } = req.body;
      
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );

      if (!updatedAppointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }

      res.json({
        status: 'success',
        data: updatedAppointment
      });
    } catch (error) {
      logger.error('Update appointment status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating appointment status'
      });
    }
  }

  async deleteAppointment(req, res) {
    try {
      const appointment = await Appointment.findByIdAndDelete(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }
      res.json({
        status: 'success',
        message: 'Appointment deleted successfully'
      });
    } catch (error) {
      logger.error('Delete appointment error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting appointment'
      });
    }
  }

  /**
   * Download appointment PDF
   */
  async downloadAppointmentPdf(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('memberId', 'name memberId')
        .populate('doctorId', 'name specializations');

      if (!appointment) {
        return res.status(404).json({
          status: 'error',
          message: 'Appointment not found'
        });
      }

      // If PDF URL exists, redirect to it
      if (appointment.pdfUrl) {
        return res.redirect(appointment.pdfUrl);
      }

      // If no PDF URL exists, return error
      return res.status(404).json({
        status: 'error',
        message: 'PDF not found for this appointment'
      });

    } catch (error) {
      logger.error('Download appointment PDF error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error downloading appointment PDF',
        details: error.message
      });
    }
  }
}

module.exports = new AppointmentController(); 