const mongoose = require('mongoose');
const AuthCredential = require('./src/models/auth-credential.model'); // correct path
const bcrypt = require('bcrypt'); // CommonJS import
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

async function run() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Hash the password
        const hashedPassword = await bcrypt.hash('Admin@123', 10); // 10 rounds salt

        // Sample Admin user data
        const adminUser = new AuthCredential({
            userId: new mongoose.Types.ObjectId(),
            userType: 'admin',
            email: 'admin@gmail.com',
            phoneNumber: '9999999999',
            password: hashedPassword, // store hashed password
        });

        // Save to database
        const savedUser = await adminUser.save();
        console.log('Admin user created:', savedUser);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
