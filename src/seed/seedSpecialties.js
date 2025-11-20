/**
 * Seed Script for Specialties + SubSpecialties
 * Run: node src/seed/seedSpecialties.js
 */

const connectDB = require("../../config/database");
const Specialty = require("../models/Specialty");
const SubSpecialty = require("../models/SubSpecialty");

const specialtiesData = require("./specialtiesSeed.json");
const subSpecialtiesData = require("./subSpecialtiesSeed.json");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    console.log("Clearing old data...");
    await Specialty.deleteMany({});
    await SubSpecialty.deleteMany({});

    console.log("Inserting specialties...");
    const specialties = await Specialty.insertMany(specialtiesData);

    const specialtyMap = {};
    specialties.forEach((sp) => {
      specialtyMap[sp.name] = sp._id;
    });

    const subInsert = subSpecialtiesData.map((sub) => ({
      name: sub.name,
      specialtyId: specialtyMap[sub.specialtyName]
    }));

    console.log("Inserting sub-specialties...");
    await SubSpecialty.insertMany(subInsert);

    console.log("\n🎉 DONE!");
    console.log(`✔ Specialties: ${specialties.length}`);
    console.log(`✔ SubSpecialties: ${subInsert.length}`);
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();
