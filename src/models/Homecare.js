const mongoose = require("mongoose");

const coverageAddressSchema = new mongoose.Schema({
  locationName: { type: String, required: true },
  addressStreet: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
});

const homecareSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }, // stored as +91XXXXXXXXXX

    servicetype: {
      type: String,
      enum: ["Home Visit", "Centre", "Both"],
      required: true,
    },

    website: { type: String, default: "" },

    address: {
      street: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      pincode: { type: String, required: true },
    },

    gstNumber: { type: String, default: "" },

    services: {
      type: [String],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0,
    },

    introduction: { type: String, default: "" },

    addresses: {
      type: [coverageAddressSchema],
      default: [],
    },

    languagesSpoken: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Homecare", homecareSchema);
