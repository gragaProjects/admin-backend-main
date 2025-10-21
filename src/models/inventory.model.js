const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  item_name: {
    type: String,
    required: true
  },
  current_stock: {
    type: Number,
    required: true
  },
  expiry_date: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema); 