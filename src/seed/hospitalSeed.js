// /**
//  * Run this script:
//  * node src/seed/hospitalSeed.js
//  */

// const mongoose = require("mongoose");
// const Department = require("../models/Department");
// const Service = require("../models/Service");
// const SubService = require("../models/SubService");
// require('dotenv').config();
// // ============================================
// // STATIC DATA
// // ============================================

// const HOSPITAL_SERVICES = [
//   "Emergency & Critical Care",
//   "Outpatient & Inpatient Care",
//   "Diagnostics",
//   "Surgical Services",
//   "Pharmacy & Medicine Supply",
//   "Maternal & Child Health",
//   "Chronic & Long-term Care",
//   "Preventive & Online Services",
//   "Support & Additional Services"
// ];

// const HOSPITAL_SUBSERVICES = {
//   "Emergency & Critical Care": [
//     "Emergency Care",
//     "Trauma Care",
//     "ICU (Intensive Care Unit)",
//     "NICU (Neonatal ICU)",
//     "PICU (Pediatric ICU)",
//     "Ambulance Services",
//     "Critical Care Unit"
//   ],
//   "Outpatient & Inpatient Care": [
//     "OPD (Outpatient Services)",
//     "IPD (Inpatient Services)",
//     "Day Care Procedures",
//     "Health Check-up Packages",
//     "Medical Records & Report Services"
//   ],
//   "Diagnostics": [
//     "Laboratory / Pathology",
//     "Blood Test",
//     "Urine Test",
//     "Biopsy",
//     "Radiology & Imaging",
//     "X-Ray",
//     "CT Scan",
//     "MRI",
//     "Ultrasound",
//     "Mammography",
//     "ECG / EKG",
//     "Endoscopy / Colonoscopy",
//     "TMT / Stress Test"
//   ],
//   "Surgical Services": [
//     "Operation Theatre (OT)",
//     "General Surgery",
//     "Laparoscopic / Minimal Invasive Surgery",
//     "Post-Surgery Care",
//     "Anesthesiology Support"
//   ],
//   "Pharmacy & Medicine Supply": [
//     "24×7 Pharmacy",
//     "Medical Store",
//     "Drug Storage & Dispensing"
//   ],
//   "Maternal & Child Health": [
//     "Maternity & Delivery",
//     "Labor Room",
//     "Antenatal & Postnatal Care",
//     "Newborn Care (NICU)",
//     "Pediatrics / Child Care",
//     "Vaccinations"
//   ],
//   "Chronic & Long-term Care": [
//     "Dialysis (Kidney Treatment)",
//     "Physiotherapy & Rehabilitation",
//     "Home Care Nursing Services",
//     "Palliative Care",
//     "Nutrition & Diet Consultation"
//   ],
//   "Preventive & Online Services": [
//     "Telemedicine / Online Consultation",
//     "Vaccination & Immunization",
//     "Health Check-up Camps"
//   ],
//   "Support & Additional Services": [
//     "Blood Bank",
//     "Mortuary Services",
//     "Insurance & Billing Support",
//     "Medical Report / Documentation Services"
//   ]
// };

// const HOSPITAL_DEPARTMENTS = [
//   "General Medicine",
//   "General Surgery",
//   "Cardiology (Heart)",
//   "Cardiothoracic Surgery",
//   "Neurology",
//   "Neurosurgery",
//   "Orthopedics (Bone & Joint)",
//   "Obstetrics & Gynecology (Maternity)",
//   "Pediatrics (Child Care)",
//   "Neonatology (Newborn Care)",
//   "Dermatology (Skin)",
//   "ENT (Ear, Nose, Throat)",
//   "Ophthalmology (Eye)",
//   "Urology (Kidney & Urinary)",
//   "Nephrology (Kidney Specialist)",
//   "Gastroenterology (Liver & Stomach)",
//   "Pulmonology (Lungs / Chest)",
//   "Endocrinology (Diabetes / Thyroid)",
//   "Oncology (Cancer Treatment)",
//   "Radiology",
//   "Anesthesiology",
//   "Psychiatry / Mental Health",
//   "Dental / Oral Health",
//   "Physiotherapy & Rehabilitation",
//   "Emergency Medicine",
//   "Critical Care Medicine",
//   "Plastic & Cosmetic Surgery",
//   "Rheumatology (Arthritis & Autoimmune)",
//   "Hematology (Blood Diseases)",
//   "Infectious Diseases",
//   "Geriatrics (Elderly Care)"
// ];

// // ============================================
// // MONGO CONNECT
// // ============================================

// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//   .then(() => seed())
//   .catch(err => console.error("Mongo Error:", err));

// // ============================================
// // SEED SCRIPT
// // ============================================

// async function seed() {
//   try {
//     console.log("⏳ Seeding started...");

//     // -------------------------------
//     // Insert Departments
//     // -------------------------------
//     for (const deptName of HOSPITAL_DEPARTMENTS) {
//       let dept = await Department.findOne({ name: deptName });

//       if (!dept) {
//         dept = await Department.create({ name: deptName });
//         console.log("✔ Department Added:", deptName);
//       } else {
//         console.log("✔ Department Exists:", deptName);
//       }
//     }

//     // -------------------------------
//     // Insert Services + SubServices
//     // -------------------------------
//     for (const serviceName of HOSPITAL_SERVICES) {
//       // We use a default technical department: "Hospital Services"
//       let dept = await Department.findOne({ name: "Hospital Services" });

//       if (!dept) {
//         dept = await Department.create({ name: "Hospital Services" });
//       }

//       // check if service exists
//       let service = await Service.findOne({ name: serviceName, departmentId: dept._id });

//       if (!service) {
//         service = await Service.create({
//           name: serviceName,
//           departmentId: dept._id
//         });
//         console.log("➕ Service Added:", serviceName);
//       } else {
//         console.log("✔ Service Exists:", serviceName);
//       }

//       // sub-services
//       const subList = HOSPITAL_SUBSERVICES[serviceName] || [];

//       for (const subName of subList) {
//         let sub = await SubService.findOne({ name: subName, serviceId: service._id });

//         if (!sub) {
//           await SubService.create({
//             name: subName,
//             serviceId: service._id
//           });
//           console.log("    → SubService Added:", subName);
//         } else {
//           console.log("    → SubService Exists:", subName);
//         }
//       }
//     }

//     console.log("🎉 SEEDING COMPLETED");
//     process.exit();
//   } catch (err) {
//     console.error("❌ Seed Error:", err);
//     process.exit(1);
//   }
// }
