const mongoose = require("mongoose");

const SubServiceSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("SubService", SubServiceSchema);
