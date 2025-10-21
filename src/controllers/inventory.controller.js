const { Inventory, School } = require('../models/index');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

exports.createItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({
      message: 'success',
      data: item
    });
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    res.status(400).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const {
      search,
      schoolId,
      expiryBefore,
      expiryAfter,
      stockLessThan,
      stockMoreThan,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    
    // Handle search parameter for item name
    if (search) {
      query.item_name = { $regex: search, $options: 'i' };
    }

    // Handle school filter using custom schoolId
    if (schoolId) {
      // Find school by custom schoolId
      const schools = await School.find({
        schoolId: { $regex: schoolId, $options: 'i' }
      }).select('_id');

      if (schools.length) {
        query.schoolId = { $in: schools.map(s => s._id) };
      } else {
        // No matching schools found, return empty result
        return res.status(200).json({
          message: 'success',
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            pages: 0
          }
        });
      }
    }

    // Handle expiry date filters
    if (expiryBefore || expiryAfter) {
      query.expiry_date = {};
      if (expiryBefore) {
        query.expiry_date.$lte = new Date(expiryBefore);
      }
      if (expiryAfter) {
        query.expiry_date.$gte = new Date(expiryAfter);
      }
    }

    // Handle stock level filters
    if (stockLessThan || stockMoreThan) {
      query.current_stock = {};
      if (stockLessThan) {
        query.current_stock.$lte = parseInt(stockLessThan);
      }
      if (stockMoreThan) {
        query.current_stock.$gte = parseInt(stockMoreThan);
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Inventory.countDocuments(query);

    // Execute main query with pagination
    const items = await Inventory.find(query)
      .sort({ item_name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('schoolId', 'name schoolId');

    res.status(200).json({
      message: 'success',
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('schoolId', 'name schoolId');
    res.status(200).json({
      message: 'success',
      data: item
    });
  } catch (error) {
    logger.error('Error fetching inventory item:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) {
      return res.status(404).json({
        message: 'error',
        error: 'Item not found'
      });
    }
    res.status(200).json({
      message: 'success',
      data: item
    });
  } catch (error) {
    logger.error('Error updating inventory item:', error);
    res.status(400).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        message: 'error',
        error: 'Item not found'
      });
    }
    res.status(204).json({
      message: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error deleting inventory item:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
}; 