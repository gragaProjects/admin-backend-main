const HealthcareProvider = require('../models/healthcare-provider.model');
const { logger } = require('../utils/logger');

// Create new healthcare provider
exports.createProvider = async (req, res) => {
  try {
    const provider = await HealthcareProvider.create(req.body);
    
    logger.info('New healthcare provider created', { providerId: provider._id });
    
    res.status(201).json({
      status: 'success',
      data: provider
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get all healthcare providers
exports.getAllProviders = async (req, res) => {
  try {
    const query = {};
    
    // Add filters if provided
    if (req.query.type) query.type = req.query.type;
    if (req.query.pinCode) query['address.pinCode'] = req.query.pinCode;
    
    const providers = await HealthcareProvider.find(query);
    
    res.status(200).json({
      status: 'success',
      results: providers.length,
      data: providers
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get single healthcare provider
exports.getProvider = async (req, res) => {
  try {
    const provider = await HealthcareProvider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'No healthcare provider found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: provider
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update healthcare provider
exports.updateProvider = async (req, res) => {
  try {
    const provider = await HealthcareProvider.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'No healthcare provider found with that ID'
      });
    }
    
    logger.info('Healthcare provider updated', { providerId: provider._id });
    
    res.status(200).json({
      status: 'success',
      data: provider
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Delete healthcare provider
exports.deleteProvider = async (req, res) => {
  try {
    const provider = await HealthcareProvider.findByIdAndDelete(req.params.id);
    
    if (!provider) {
      return res.status(404).json({
        status: 'fail',
        message: 'No healthcare provider found with that ID'
      });
    }
    
    logger.info('Healthcare provider deleted', { providerId: req.params.id });
    
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