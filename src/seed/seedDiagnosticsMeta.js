/**
 * Seed Script for Diagnostics Services + Cities
 * Run: node src/seed/seedDiagnosticsMeta.js
 */

const connectDB = require("../../config/database");
const DiagnosticService = require("../models/DiagnosticService");
const DiagnosticCity = require("../models/DiagnosticCity");

const { DIAGNOSTIC_SERVICES, DIAGNOSTIC_CITIES } = require("./diagnosticsData");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    console.log("Clearing old data...");
    await DiagnosticService.deleteMany({});
    await DiagnosticCity.deleteMany({});

    console.log("Inserting Diagnostic Services...");
    const services = await DiagnosticService.insertMany(
      DIAGNOSTIC_SERVICES.map((name) => ({ name }))
    );

    console.log("Inserting Diagnostic Cities...");
    const cities = await DiagnosticCity.insertMany(
      DIAGNOSTIC_CITIES.map((name) => ({ name }))
    );

    console.log("\n🎉 DONE!");
    console.log(`✔ Diagnostic Services: ${services.length}`);
    console.log(`✔ Diagnostic Cities: ${cities.length}`);

    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();
