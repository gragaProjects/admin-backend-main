// // admin-backend-main/src/models/Doctor.js
// const mongoose = require('mongoose');

// const DoctorSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },

//   mcn: { type: String }, // medical council reg no
//   experience: { type: Number },
//   qualification: { type: String },

//   specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' },
//   subSpecialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubSpecialty' },

//   consultationTypes: [{ type: String }], // online/offline/home
//   consultationFee: { type: Number },

//   photoUrl: { type: String },
//   photoPublicId: { type: String },

//   clinicName: String,
//   address: String,
//   area: String,
//   city: String,
//   state: String,
//   pincode: String,

//   bio: String,
// }, { timestamps: true });

// module.exports = mongoose.model('HealthCare-Doctor', DoctorSchema);
///  1111111111111
// const mongoose = require("mongoose");

// const TimeSlotSchema = new mongoose.Schema({
//   day: { type: String, required: true }, // "monday"
//   slots: [{ type: String }],             // ["10:00 | 11:00"]
// });

// const AreaSchema = new mongoose.Schema({
//   pincode: String,
//   region: String,
//   areaName: String,
// });

// const HomeVisitLocationSchema = new mongoose.Schema({
//   pincode: String,
//   region: String,
//   city: String,
//   state: String,
// });

// const OfflineAddressSchema = new mongoose.Schema({
//   description: String,
//   landmark: String,
//   region: String,
//   city: String,
//   state: String,
//   pinCode: String,
//   country: { type: String, default: "India" },
// });

// const DoctorSchema = new mongoose.Schema(
//   {
//     // BASIC DETAILS
//     name: { type: String, required: true },
//     gender: { type: String, enum: ["Male", "Female", "Other"] },
//     email: { type: String, required: true },
//     phone: { type: String, required: true },

//     // PROFESSIONAL DETAILS
//     qualification: { type: String },
//     medicalCouncilRegistrationNumber: { type: String },
//     experienceYears: { type: Number },
//     languagesSpoken: [{ type: String }],

//     // SPECIALTY / SUB-SPECIALTY
//     specialty: { type: String },               // From DB
//     specializations: [{ type: String }],        // Multiple subs

//     // SERVICES
//     serviceTypes: [{ type: String }], // online / offline / homeVisit

//     // AREAS (FOR OFFLINE)
//     areas: [AreaSchema],

//     // ADDRESS (FOR OFFLINE CONSULTATION CLINIC)
//     offlineAddress: OfflineAddressSchema,

//     // TIME SLOTS
//     onlineConsultationTimeSlots: [TimeSlotSchema],
//     offlineConsultationTimeSlots: [TimeSlotSchema],

//     // HOME VISIT
//     homeVisitEnabled: { type: Boolean, default: false },
//     homeVisitLocations: [HomeVisitLocationSchema],

//     // MEDIA
//     photoUrl: String,
//     photoPublicId: String,
//     digitalSignature: String,

//     // INTRODUCTION / ABOUT
//     introduction: String,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('HealthCare-Doctor', DoctorSchema);
//--------------------
const mongoose = require("mongoose");

const TimeSlotSchema = new mongoose.Schema({
  day: { type: String, required: true },
  slots: [{ type: String }],
});

const AreaSchema = new mongoose.Schema({
  pincode: String,
  region: String,
  areaName: String,
});

const HomeVisitLocationSchema = new mongoose.Schema({
  pincode: String,
  region: String,
  city: String,
  state: String,
});

const OfflineAddressSchema = new mongoose.Schema({
  description: String,
  landmark: String,
  region: String,
  city: String,
  state: String,
  pinCode: String,
  country: { type: String, default: "India" },
});

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    email: { type: String, required: true },
    phone: { type: String, required: true },

   qualification: [{ type: String }],
    medicalCouncilRegistrationNumber: String,
    experienceYears: Number,
    languagesSpoken: [{ type: String }],

    specialty: { type: String },               // From DB
    specializations: [{ type: String }],        // Multiple subs

    serviceTypes: [{ type: String }],

    areas: [AreaSchema],

    offlineAddress: OfflineAddressSchema,

    onlineConsultationTimeSlots: [TimeSlotSchema],
    offlineConsultationTimeSlots: [TimeSlotSchema],

    homeVisitEnabled: { type: Boolean, default: false },
    homeVisitLocations: [HomeVisitLocationSchema],

    photoUrl: String,
    photoPublicId: String,
    digitalSignature: String,

    introduction: String,
  },
  { timestamps: true }
);

// IMPORTANT FIX: VALID MODEL NAME
module.exports = mongoose.model("HealthcareDoctor", DoctorSchema);
