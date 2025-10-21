const { MedicalHistory, Member } = require('../models/index');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

class MedicalHistoryController {

  /**
   * Validate medical history data according to model schema
   */
  validateMedicalHistoryData(data) {
    const errors = [];

    // Validate familyHistory
    if (data.familyHistory) {
      if (!Array.isArray(data.familyHistory)) {
        errors.push('familyHistory must be an array');
      } else {
        data.familyHistory.forEach((item, index) => {
          if (item.relationship && !['father', 'mother', 'sibling', 'grandparent', 'other'].includes(item.relationship)) {
            errors.push(`familyHistory[${index}].relationship must be one of: father, mother, sibling, grandparent, other`);
          }
        });
      }
    }

    // Validate allergies
    if (data.allergies) {
      if (!Array.isArray(data.allergies)) {
        errors.push('allergies must be an array');
      }
    }

    // Validate currentMedications
    if (data.currentMedications) {
      if (!Array.isArray(data.currentMedications)) {
        errors.push('currentMedications must be an array');
      }
    }

    // Validate surgeries
    if (data.surgeries) {
      if (!Array.isArray(data.surgeries)) {
        errors.push('surgeries must be an array');
      } else {
        data.surgeries.forEach((item, index) => {
          if (item.date && !Date.parse(item.date)) {
            errors.push(`surgeries[${index}].date must be a valid date`);
          }
        });
      }
    }

    // Validate previousMedicalConditions
    if (data.previousMedicalConditions) {
      if (!Array.isArray(data.previousMedicalConditions)) {
        errors.push('previousMedicalConditions must be an array');
      } else {
        data.previousMedicalConditions.forEach((item, index) => {
          if (item.status && !['active', 'resolved', 'inremission', 'chronic'].includes(item.status)) {
            errors.push(`previousMedicalConditions[${index}].status must be one of: active, resolved, inremission, chronic`);
          }
          if (item.diagnosedAt && !Date.parse(item.diagnosedAt)) {
            errors.push(`previousMedicalConditions[${index}].diagnosedAt must be a valid date`);
          }
        });
      }
    }

    // Validate immunizations
    if (data.immunizations) {
      if (!Array.isArray(data.immunizations)) {
        errors.push('immunizations must be an array');
      } else {
        data.immunizations.forEach((item, index) => {
          if (item.date && !Date.parse(item.date)) {
            errors.push(`immunizations[${index}].date must be a valid date`);
          }
        });
      }
    }

    // Validate medicalTestResults
    if (data.medicalTestResults) {
      if (!Array.isArray(data.medicalTestResults)) {
        errors.push('medicalTestResults must be an array');
      } else {
        data.medicalTestResults.forEach((item, index) => {
          if (item.date && !Date.parse(item.date)) {
            errors.push(`medicalTestResults[${index}].date must be a valid date`);
          }
        });
      }
    }

    // Validate currentSymptoms
    if (data.currentSymptoms) {
      if (!Array.isArray(data.currentSymptoms)) {
        errors.push('currentSymptoms must be an array');
      }
    }

    // Validate lifestyleHabits
    if (data.lifestyleHabits) {
      if (typeof data.lifestyleHabits !== 'object') {
        errors.push('lifestyleHabits must be an object');
      } else {
        const validOptions = ['never', 'occasional', 'daily'];
        if (data.lifestyleHabits.smoking && !validOptions.includes(data.lifestyleHabits.smoking)) {
          errors.push('lifestyleHabits.smoking must be one of: never, occasional, daily');
        }
        if (data.lifestyleHabits.alcoholConsumption && !validOptions.includes(data.lifestyleHabits.alcoholConsumption)) {
          errors.push('lifestyleHabits.alcoholConsumption must be one of: never, occasional, daily');
        }
        if (data.lifestyleHabits.exercise && !validOptions.includes(data.lifestyleHabits.exercise)) {
          errors.push('lifestyleHabits.exercise must be one of: never, occasional, daily');
        }
      }
    }

    // Validate healthInsurance
    if (data.healthInsurance) {
      if (!Array.isArray(data.healthInsurance)) {
        errors.push('healthInsurance must be an array');
      } else {
        data.healthInsurance.forEach((item, index) => {
          if (item.expiryDate && !Date.parse(item.expiryDate)) {
            errors.push(`healthInsurance[${index}].expiryDate must be a valid date`);
          }
        });
      }
    }

    // Validate medicalReports
    if (data.medicalReports) {
      if (!Array.isArray(data.medicalReports)) {
        errors.push('medicalReports must be an array');
      }
    }

    // Validate treatingDoctors
    if (data.treatingDoctors) {
      if (!Array.isArray(data.treatingDoctors)) {
        errors.push('treatingDoctors must be an array');
      }
    }

    // Validate followUps
    if (data.followUps) {
      if (!Array.isArray(data.followUps)) {
        errors.push('followUps must be an array');
      } else {
        data.followUps.forEach((item, index) => {
          if (item.date && !Date.parse(item.date)) {
            errors.push(`followUps[${index}].date must be a valid date`);
          }
        });
      }
    }

    return errors;
  }

  /**
   * Create medical history
   */
  async create(req, res) {
    try {
      const { memberId } = req.params;
      const requestData = req.body;

      // Check if member exists
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({
          status: 'error',
          message: 'Member not found'
        });
      }

      // Parse allergies if it's a string
      if (requestData.allergies && typeof requestData.allergies === 'string') {
        try {
          requestData.allergies = JSON.parse(requestData.allergies);
        } catch (parseError) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid allergies format. Expected JSON array.'
          });
        }
      }

      // Validate the request body according to model schema
      /*const validationErrors = this.validateMedicalHistoryData(requestData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Check if medical history already exists for this member
      const existingMedicalHistory = await MedicalHistory.findOne({ memberId });
      if (existingMedicalHistory) {
        return res.status(409).json({
          status: 'error',
          message: 'Medical history already exists for this member. Use update instead.'
        });
      }*/

      // Create medical history with validated data
      const medicalHistory = new MedicalHistory({
        memberId,
        ...requestData
      });

      await medicalHistory.save();

      res.status(201).json({
        status: 'success',
        data: medicalHistory
      });
    } catch (error) {
      logger.error('Create medical history error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * 
   * Get medical history by member ID (all by default, specific if ID provided)
   */
  async getAll(req, res) {
    try {
      const { memberId } = req.params;
      const medicalHistoryId = req.query.id;

      let medicalHistory;

      if (medicalHistoryId) {
        // Fetch specific medical history by ID and memberId
        medicalHistory = await MedicalHistory.findOne({ 
          memberId, 
          _id: new mongoose.Types.ObjectId(medicalHistoryId) 
        });
        
        if (!medicalHistory) {
          return res.status(200).json({
            status: 'success',
            message: 'No medical history found',
            data: null
          });
        }
      } else {
        // Fetch all medical histories for the member
        medicalHistory = await MedicalHistory.find({ memberId });
        
        if (!medicalHistory || medicalHistory.length === 0) {
          return res.status(200).json({
            status: 'success',
            message: 'No medical history found',
            data: [],
            count: 0
          });
        }
      }

      res.json({
        status: 'success',
        data: medicalHistory,
        count: Array.isArray(medicalHistory) ? medicalHistory.length : 1
      });
    } catch (error) {
      logger.error('Get medical history error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Update medical history (partial updates supported)
   */
  async updatebyId(req, res) {
    try {
      const { memberId } = req.params;
      const medicalHistoryId = req.query.id;
      if(!medicalHistoryId){
        return res.status(400).json({
          status: 'error',
          message: 'Medical history ID is required'
        });
      }

      // Parse allergies if it's a string
      if (req.body.allergies && typeof req.body.allergies === 'string') {
        try {
          req.body.allergies = JSON.parse(req.body.allergies);
        } catch (parseError) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid allergies format. Expected JSON array.'
          });
        }
      }

      // Validate the request body according to model schema
      /*const validationErrors = this.validateMedicalHistoryData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }*/

      // Check if medical history exists before updating (since upsert is false)
      const existingMedicalHistory = await MedicalHistory.findOne({ memberId, _id: new mongoose.Types.ObjectId(medicalHistoryId) });
      if (!existingMedicalHistory) {
        return res.status(404).json({
          status: 'error',
          message: 'Medical history not found. Cannot create new medical history through update.'
        });
      }

      const medicalHistory = await MedicalHistory.findOneAndUpdate(
        { memberId: req.params.memberId },
        { $set: req.body },
        { new: true, runValidators: true, upsert: false }
      );

      if (!medicalHistory) {
        return res.status(404).json({
          status: 'error',
          message: 'Medical history not found'
        });
      }

      res.json({
        status: 'success',
        data: medicalHistory
      });
    } catch (error) {
      logger.error('Update medical history error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Delete medical history
   */
  async deletebyId(req, res) {
    try {
      const { memberId } = req.params;
      const medicalHistoryId = req.query.id;
      if(!medicalHistoryId){
        return res.status(400).json({
          status: 'error',
          message: 'Medical history ID is required'
        });
      }
      const medicalHistory = await MedicalHistory.findOneAndDelete({ memberId, _id: new mongoose.Types.ObjectId(medicalHistoryId) });
      if (!medicalHistory) {
        return res.status(404).json({
          status: 'error',
          message: 'Medical history not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Medical history deleted successfully'
      });
    } catch (error) {
      logger.error('Delete medical history error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

}

module.exports = new MedicalHistoryController(); 