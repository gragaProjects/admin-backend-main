const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Member = require('../src/models/member.model');
const AuthCredential = require('../src/models/auth-credential.model');

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

function transformMemberData(jsonMember) {
    // Skip members whose names start with "test" (case insensitive)
    if (jsonMember.name.toLowerCase().startsWith('test')) {
        return null;
    }

    const emergencyContact = jsonMember.emergency_contact_name ? {
        name: jsonMember.emergency_contact_name,
        relation: jsonMember.emergency_contact_relationship?.toLowerCase() || 'other',
        phone: jsonMember.emergency_contact_phone
    } : undefined;

    // Transform address to match the schema
    const address = jsonMember.address ? [{
        description: jsonMember.address, // Full address goes into description
        state: 'Karnataka',
        country: 'India',
        // Other fields will be undefined by default
        pinCode: undefined,
        region: undefined,
        landmark: undefined,
        location: {
            latitude: undefined,
            longitude: undefined
        },
        name: undefined
    }] : [];

    // Handle gender transformation
    let gender = jsonMember.gender?.toLowerCase();
    if (gender !== 'male' && gender !== 'female') {
        gender = 'other';
    }

    // Parse registration date from MM/DD/YYYY format
    let registrationDate;
    if (jsonMember.created_on) {
        const [month, day, year] = jsonMember.created_on.split('/');
        registrationDate = new Date(year, parseInt(month) - 1, parseInt(day)); // month is 0-based in Date constructor
    }

    // Calculate expiry date by creating a new Date object to avoid modifying the original
    const expiryDate = new Date(registrationDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return {
        memberId: jsonMember.member_id,
        name: jsonMember.name,
        email: jsonMember.email,
        phone: formatPhoneNumber(jsonMember.number),
        gender: gender,
        dob: jsonMember.dob ? new Date(jsonMember.dob) : undefined,
        address: address,
        additionalInfo: jsonMember.additional_information,
        active: true,
        membershipStatus: {
            isRegistered: true,
            registrationDate: registrationDate,
            premiumMembership: {
                isActive: true,
                startDate: registrationDate,
                expiryDate: expiryDate,
            }
        },
        termsConditionsAccepted: true,
        onBoarded: true,
        isMember: true
    };
}

function formatPhoneNumber(phone) {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If the number already starts with 91, add + prefix
    if (cleanPhone.startsWith('91')) {
        return '+' + cleanPhone;
    }
    
    // If the number is 10 digits, add +91 prefix
    if (cleanPhone.length === 10) {
        return '+91' + cleanPhone;
    }
    
    // If the number starts with +, return as is
    if (phone.startsWith('+')) {
        return phone;
    }
    
    // For any other case, add +91 if not present
    return '+91' + cleanPhone;
}

async function createAuthCredential(member) {
    try {
        const formattedPhone = formatPhoneNumber(member.phone);
        console.log(`Formatting phone number: ${member.phone} -> ${formattedPhone}`);
        
        const authData = {
            userId: member._id,
            userType: 'member',
            memberId: member.memberId,
            phoneNumber: formattedPhone,
            email: member.email,
            isActive: true,
            isFirstLogin: true
        };

        const authCredential = new AuthCredential(authData);
        await authCredential.save();
        console.log(`Created auth credential for member: ${member.name}`);
        return true;
    } catch (error) {
        console.error(`Failed to create auth credential for member ${member.name}:`, error.message);
        return false;
    }
}

async function importMembers() {
    try {
        // Connect to database
        await connectToDatabase();

        // Read the JSON file
        const jsonData = await fs.readFile(path.join(__dirname, 'members.json'), 'utf8');
        const data = JSON.parse(jsonData);
        
        // The members are in the "members" array
        const members = data.members || [];

        if (members.length === 0) {
            console.log('No members found in the JSON file');
            return;
        }

        // Filter out members with isSubprofile: "Yes" and test members, then transform the remaining data
        const transformedMembers = members
            .filter(member => member.isSubprofile !== "Yes")
            .map(transformMemberData)
            .filter(member => member !== null); // Remove null entries (test members)

        console.log(`Filtered out ${members.length - transformedMembers.length} subprofiles and test members`);

        // First, delete all existing members and their auth credentials to avoid conflicts
        await Member.deleteMany({});
        await AuthCredential.deleteMany({ userType: 'member' });
        console.log('Cleared existing members and their auth credentials');

        // Insert members sequentially
        let memberSuccessCount = 0;
        let authSuccessCount = 0;
        for (const memberData of transformedMembers) {
            try {
                const member = new Member(memberData);
                await member.save();
                memberSuccessCount++;
                console.log(`Imported member ${memberSuccessCount}/${transformedMembers.length}: ${memberData.name}`);

                // Create auth credentials for the member
                const authCreated = await createAuthCredential(member);
                if (authCreated) {
                    authSuccessCount++;
                }
            } catch (error) {
                console.error(`Failed to import member ${memberData.name}:`, error.message);
            }
        }
        
        console.log(`Successfully imported ${memberSuccessCount} out of ${transformedMembers.length} members`);
        console.log(`Successfully created ${authSuccessCount} out of ${memberSuccessCount} auth credentials`);

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the import
importMembers(); 