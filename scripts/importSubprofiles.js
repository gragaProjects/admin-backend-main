const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Member = require('../src/models/member.model');

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

function transformSubprofileData(jsonMember, parentMember) {
    const emergencyContact = jsonMember.emergency_contact_name ? {
        name: jsonMember.emergency_contact_name,
        relation: jsonMember.emergency_contact_relationship?.toLowerCase() || 'other',
        phone: jsonMember.emergency_contact_phone
    } : undefined;

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

    return {
        memberId: jsonMember.member_id,
        name: jsonMember.name,
        email: jsonMember.email,
        phone: parentMember.phone, // Use parent's phone number
        gender: gender,
        dob: jsonMember.dob ? new Date(jsonMember.dob) : undefined,
        address: address,
        additionalInfo: jsonMember.additional_information,
        active: true,
        isSubprofile: true,
        onBoarded: true,
        termsConditionsAccepted: true,
        isMember: false
        // primaryMemberId will be set later after finding the parent in MongoDB
    };
}

async function importSubprofiles() {
    try {
        // Connect to database
        await connectToDatabase();

        // Read the JSON file
        const jsonData = await fs.readFile(path.join(__dirname, 'members.json'), 'utf8');
        const data = JSON.parse(jsonData);
        const allMembers = data.members || [];
        
        // Get only subprofile members
        const subprofiles = allMembers.filter(member => member.isSubprofile === "Yes");

        if (subprofiles.length === 0) {
            console.log('No subprofiles found in the JSON file');
            return;
        }

        console.log(`Found ${subprofiles.length} subprofiles to import`);

        // Create a map to store parent data
        const parentDataMap = {};
        allMembers.forEach(member => {
            parentDataMap[member.id] = {
                memberId: member.member_id,
                name: member.name
            };
        });

        // Import subprofiles and link them to their parents
        let successCount = 0;
        for (const subprofileData of subprofiles) {
            try {
                // First get the parent's member_id from the JSON data
                const parentData = parentDataMap[subprofileData.parent_member];
                
                if (!parentData) {
                    console.error(`Could not find parent data for id ${subprofileData.parent_member} (subprofile: ${subprofileData.name})`);
                    continue;
                }

                // Find the parent member in MongoDB using the member_id
                const parentMember = await Member.findOne({ memberId: parentData.memberId });
                
                if (!parentMember) {
                    console.error(`Parent member with memberId ${parentData.memberId} not found in MongoDB (subprofile: ${subprofileData.name})`);
                    continue;
                }

                // Transform and create the subprofile, passing the parent member
                const transformedData = transformSubprofileData(subprofileData, parentMember);
                transformedData.primaryMemberId = parentMember._id; // Set the MongoDB _id of parent

                const subprofile = new Member(transformedData);
                await subprofile.save();

                // Update parent's subprofileIds array with the new subprofile's MongoDB _id
                await Member.findByIdAndUpdate(
                    parentMember._id,
                    { 
                        $addToSet: { 
                            subprofileIds: subprofile._id 
                        }
                    },
                    { new: true } // Return the updated document
                );

                successCount++;
                console.log(`Imported subprofile ${successCount}/${subprofiles.length}: ${subprofileData.name} (Parent: ${parentData.name}, MemberId: ${parentData.memberId})`);
            } catch (error) {
                console.error(`Failed to import subprofile ${subprofileData.name}:`, error.message);
            }
        }
        
        console.log(`Successfully imported ${successCount} out of ${subprofiles.length} subprofiles`);

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the import
importSubprofiles(); 