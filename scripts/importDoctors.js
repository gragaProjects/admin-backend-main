const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Doctor = require('../src/models/doctor.model');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://digitalconquest:UDlofuJT1YsAwO7P@assisthealth-cluster.wam0sh4.mongodb.net/production';

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Database successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function transformDoctorData(jsonDoctor) {
    // Split languages into an array, clean up whitespace and capitalize first letter
    const languages = jsonDoctor.language_spoken
        ? jsonDoctor.language_spoken.split(',')
            .map(lang => lang.trim())
            .map(capitalizeFirstLetter)
        : [];

    // Split qualification into an array if it contains multiple qualifications
    const qualifications = jsonDoctor.qualification
        ? jsonDoctor.qualification.split(',').map(qual => qual.trim())
        : [];

    return {
        name: jsonDoctor.name.trim(),
        email: jsonDoctor.email,
        phone: jsonDoctor.mobile_no,
        gender: jsonDoctor.gender.toLowerCase(),
        profilePic: jsonDoctor.profile_picture || null,
        digitalSignature: jsonDoctor.sign || null,
        languagesSpoken: languages,
        qualification: qualifications,
        medicalCouncilRegistrationNumber: jsonDoctor.medical_council_no,
        introduction: jsonDoctor.intro || null,
        role: 'doctor',
        serviceTypes: ['online', 'offline'], // Default to both service types
        total_assigned_members: 0,
        rating: 0,
        navigatorAssigned: false
    };
}

async function importDoctors() {
    try {
        // Connect to database
        await connectToDatabase();

        // Read the JSON file
        const jsonData = await fs.readFile(path.join(__dirname, 'doctors.json'), 'utf8');
        const data = JSON.parse(jsonData);
        
        // The doctors are in the "doctors" array
        const doctors = data.doctors;

        // Transform the data
        const transformedDoctors = doctors.map(transformDoctorData);

        // First, delete all existing doctors to avoid conflicts
        await Doctor.deleteMany({});
        console.log('Cleared existing doctors');

        // Insert doctors sequentially
        let successCount = 0;
        for (const doctorData of transformedDoctors) {
            try {
                const doctor = new Doctor(doctorData);
                await doctor.save();
                successCount++;
                console.log(`Imported doctor ${successCount}/${transformedDoctors.length}: ${doctorData.name}`);
            } catch (error) {
                console.error(`Failed to import doctor ${doctorData.name}:`, error.message);
            }
        }
        
        console.log(`Successfully imported ${successCount} out of ${transformedDoctors.length} doctors`);

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the import
importDoctors(); 