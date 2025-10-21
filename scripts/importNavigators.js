const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Navigator = require('../src/models/navigator.model');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://digitalconquest:UDlofuJT1YsAwO7P@assisthealth-cluster.wam0sh4.mongodb.net/production';

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function transformNavigatorData(jsonNavigator) {
    // Split languages into an array, clean up whitespace and capitalize first letter
    const languages = jsonNavigator.language_spoken
        ? jsonNavigator.language_spoken.split(',')
            .map(lang => lang.trim())
            .map(capitalizeFirstLetter)
        : [];

    return {
        name: jsonNavigator.name,
        email: jsonNavigator.email,
        phone: jsonNavigator.mobile_no,
        gender: jsonNavigator.gender.toLowerCase(),
        profilePic: jsonNavigator.profile_picture || null,
        languagesSpoken: languages,
        introduction: jsonNavigator.intro || null,
        role: 'navigator',
        total_assigned_members: 0,
        rating: 0
    };
}

async function importNavigators() {
    try {
        // Connect to database
        await connectToDatabase();

        // Read the JSON file
        const jsonData = await fs.readFile(path.join(__dirname, 'navigators.json'), 'utf8');
        const data = JSON.parse(jsonData);
        
        // The navigators are in the "manager" array
        const navigators = data.manager;

        // Transform the data
        const transformedNavigators = navigators.map(transformNavigatorData);

        // First, delete all existing navigators to avoid conflicts
        await Navigator.deleteMany({});
        console.log('Cleared existing navigators');

        // Insert navigators sequentially
        let successCount = 0;
        for (const navigatorData of transformedNavigators) {
            try {
                const navigator = new Navigator(navigatorData);
                await navigator.save();
                successCount++;
                console.log(`Imported navigator ${successCount}/${transformedNavigators.length}: ${navigatorData.name}`);
            } catch (error) {
                console.error(`Failed to import navigator ${navigatorData.name}:`, error.message);
            }
        }
        
        console.log(`Successfully imported ${successCount} out of ${transformedNavigators.length} navigators`);

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the import
importNavigators(); 