const mongoose = require("mongoose");

const coverageAddressSchema = new mongoose.Schema({
  locationName: { type: String, required: true },
  addressStreet: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
});

const diagnosticsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String, default: "" },

    address: {
      street: { type: String, required: true },
      area: { type:String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      pincode: { type: String, required: true }
    },

    gstNumber: { type: String, default: "" },

    services: { type: [String], required: true },

    introduction: { type: String, default: "" },

    addresses: { type: [coverageAddressSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagnostics", diagnosticsSchema);
