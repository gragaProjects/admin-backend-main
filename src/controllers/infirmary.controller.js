const { Infirmary, Inventory } = require('../models/index');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

exports.createVisit = async (req, res) => {
  try {
    const visit = await Infirmary.create(req.body);
    console.log(`visit: ${JSON.stringify(visit)}`);
    console.log(`req.body.medicineProvided: ${JSON.stringify(req.body.medicineProvided)}`);
    //update inventory stock
    const inventory = await Inventory.findById(req.body.medicineProvided.inventoryId);
    inventory.current_stock -= req.body.medicineProvided.quantity;
    console.log(`inventory: ${JSON.stringify(inventory)}`);
    await inventory.save();

    res.status(201).json({
      message: 'success',
      data: visit
    });
  } catch (error) {
    logger.error('Error creating infirmary visit:', error);
    res.status(400).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.getVisits = async (req, res) => {
  try {
    const {
      search,
      studentId,
      studentName,
      class: grade,
      section,
      fromDate,
      toDate,
      schoolId,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    let studentQuery = {};
    let schoolQuery = {};
    
    // Handle search parameter for general search
    if (search) {
      // Search in related collections first to get the MongoDB ObjectIds
      const [students, nurses] = await Promise.all([
        mongoose.model('Member').find({ 
          $or: [
            { memberId: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
          ]
        }).select('_id'),
        mongoose.model('Nurse').find({ 
          $or: [
            { nurseId: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
          ]
        }).select('_id')
      ]);

      query.$or = [
        { complaints: { $regex: search, $options: 'i' } },
        { treatmentGiven: { $regex: search, $options: 'i' } }
      ];

      if (students.length) {
        query.$or.push({ studentId: { $in: students.map(s => s._id) } });
      }
      if (nurses.length) {
        query.$or.push({ nurseId: { $in: nurses.map(n => n._id) } });
      }
    }

    // Handle school filter
    if (schoolId) {
      // Find school by custom schoolId
      const schools = await mongoose.model('School').find({
        schoolId: { $regex: schoolId, $options: 'i' }
      }).select('_id');

      if (schools.length) {
        // If we already have an $or condition from search
        if (query.$or) {
          query = {
            $and: [
              { schoolId: { $in: schools.map(s => s._id) } },
              { $or: query.$or }
            ]
          };
        } else {
          query.schoolId = { $in: schools.map(s => s._id) };
        }
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

    // Build student filters
    if (studentId || studentName || grade || section) {
      if (studentId) {
        studentQuery.memberId = { $regex: studentId, $options: 'i' };
      }
      if (studentName) {
        studentQuery.name = { $regex: studentName, $options: 'i' };
      }
      if (grade) {
        studentQuery['studentDetails.grade'] = grade;
      }
      if (section) {
        studentQuery['studentDetails.section'] = { $regex: section, $options: 'i' };
      }

      // Get matching student IDs
      const students = await mongoose.model('Member').find(studentQuery).select('_id');
      if (students.length) {
        // If we already have an $or condition from search or school filter
        if (query.$or || query.$and) {
          query = {
            $and: [
              { studentId: { $in: students.map(s => s._id) } },
              ...(query.$and || [query])
            ]
          };
        } else {
          query.studentId = { $in: students.map(s => s._id) };
        }
      } else {
        // No matching students found, return empty result
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

    // Date range filter
    if (fromDate || toDate) {
      const dateQuery = {};
      if (fromDate) {
        dateQuery.$gte = new Date(fromDate);
      }
      if (toDate) {
        dateQuery.$lte = new Date(toDate);
      }

      // Add date filter to existing query
      if (query.$and) {
        query.$and.push({ date: dateQuery });
      } else if (query.$or) {
        query = {
          $and: [
            { date: dateQuery },
            { $or: query.$or }
          ]
        };
      } else {
        query.date = dateQuery;
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Infirmary.countDocuments(query);

    // Execute main query with pagination
    const visits = await Infirmary.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('studentId', 'name memberId studentDetails.grade studentDetails.section')
      .populate('nurseId', 'name nurseId')
      .populate('schoolId', 'name schoolId')
      .populate('medicineProvided.inventoryId', 'item_name');

    res.status(200).json({
      message: 'success',
      data: visits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching infirmary visits:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.getVisitById = async (req, res) => {
  try {
    const visit = await Infirmary.findById(req.params.id)
    .populate('medicineProvided.inventoryId', 'item_name');
    res.status(200).json({
      message: 'success',
      data: visit
    });
  } catch (error) {
    logger.error('Error fetching infirmary visit:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const visit = await Infirmary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!visit) {
      return res.status(404).json({
        message: 'error',
        error: 'Visit not found'
      });
    }
    res.status(200).json({
      message: 'success',
      data: visit
    });
  } catch (error) {
    logger.error('Error updating infirmary visit:', error);
    res.status(400).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    const visit = await Infirmary.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({
        message: 'error',
        error: 'Visit not found'
      });
    }
    res.status(204).json({
      message: 'success',
      data: `Visit ${req.params.id} deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting infirmary visit:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
};

exports.searchVisits = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      studentName,
      complaints,
      treatmentGiven,
      medicineName,
      schoolName,
      nurseName,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};
    let studentQuery = {};
    let nurseQuery = {};
    let schoolQuery = {};
    let medicineQuery = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Text based filters
    if (complaints) query.complaints = { $regex: complaints, $options: 'i' };
    if (treatmentGiven) query.treatmentGiven = { $regex: treatmentGiven, $options: 'i' };
    
    // Related collection filters
    if (studentName) studentQuery.name = { $regex: studentName, $options: 'i' };
    if (nurseName) nurseQuery.name = { $regex: nurseName, $options: 'i' };
    if (schoolName) schoolQuery.name = { $regex: schoolName, $options: 'i' };
    if (medicineName) medicineQuery.item_name = { $regex: medicineName, $options: 'i' };

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // First get IDs from related collections if filters are applied
    let studentIds, nurseIds, schoolIds, medicineIds;

    if (Object.keys(studentQuery).length) {
      const students = await mongoose.model('Member').find(studentQuery).select('_id');
      studentIds = students.map(s => s._id);
      if (studentIds.length) query.studentId = { $in: studentIds };
      else return res.status(200).json({ message: 'success', data: [], total: 0 });
    }

    if (Object.keys(nurseQuery).length) {
      const nurses = await mongoose.model('Nurse').find(nurseQuery).select('_id');
      nurseIds = nurses.map(n => n._id);
      if (nurseIds.length) query.nurseId = { $in: nurseIds };
      else return res.status(200).json({ message: 'success', data: [], total: 0 });
    }

    if (Object.keys(schoolQuery).length) {
      const schools = await mongoose.model('School').find(schoolQuery).select('_id');
      schoolIds = schools.map(s => s._id);
      if (schoolIds.length) query.schoolId = { $in: schoolIds };
      else return res.status(200).json({ message: 'success', data: [], total: 0 });
    }

    if (Object.keys(medicineQuery).length) {
      const medicines = await mongoose.model('Inventory').find(medicineQuery).select('_id');
      medicineIds = medicines.map(m => m._id);
      if (medicineIds.length) query['medicineProvided.inventoryId'] = { $in: medicineIds };
      else return res.status(200).json({ message: 'success', data: [], total: 0 });
    }

    // Get total count for pagination
    const total = await Infirmary.countDocuments(query);

    // Execute main query with pagination
    const visits = await Infirmary.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('studentId', 'name memberId studentDetails.grade studentDetails.section')
      .populate('nurseId', 'name')
      .populate('schoolId', 'name')
      .populate('medicineProvided.inventoryId', 'item_name');

    res.status(200).json({
      message: 'success',
      data: visits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error searching infirmary visits:', error);
    res.status(500).json({
      message: 'error',
      error: error.message
    });
  }
}; 