const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlogSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  author: {
    type: {
      type: String,
      enum: ['admin', 'navigator', 'doctor', 'empanelled_doctor', 'member', 'student', 'nurse']
    },
    name: String
  },
  featuredImage: String,
  readTimeMins: Number,
  category: String,
  tags: [String],
  publishDate: Date,
  status: {
    type: String,
    enum: ['draft', 'published']
  }
}, { timestamps: true });

// Add indexes
BlogSchema.index({ title: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ publishDate: 1 });

module.exports = mongoose.model('Blog', BlogSchema); 