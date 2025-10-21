const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: String,
  mrp: Number,
  discountInPercentage: Number,
  sellingPrice: Number,
  description: String,
  stock: Number,
  images: [String]
}, { timestamps: true });

// Add indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sellingPrice: 1 });

module.exports = mongoose.model('Product', ProductSchema); 