const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    immutable: true
  },
  description: String,
  pinCode: String,
  region: String,
  landmark: String,
  state: String,
  country: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  name: String
});

const noteSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    immutable: true
  },
  note: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const timeSlotSchema = new Schema({
  day: String,
  from: String,
  to: String
});

module.exports = {
  addressSchema,
  timeSlotSchema,
  noteSchema
}; 