const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

async function convertCSVToJSON() {
    const results = [];
    
    // Create a Promise to handle the stream
    const parseCSV = new Promise((resolve, reject) => {
        createReadStream(path.join(__dirname, 'members_exported.csv'))
            .pipe(csv({
                mapValues: ({ header, value }) => {
                    // Convert numeric strings to numbers where appropriate
                    if (['isActive', 'member_status', 'navigator_status', 'doctor_status', 'approve_status'].includes(header)) {
                        return parseInt(value) || 0;
                    }
                    return value;
                }
            }))
            .on('data', (data) => {
                // Transform CSV column names back to original JSON format
                const member = {
                    member_id: data['Member ID'],
                    name: data['Name'],
                    email: data['Email'],
                    gender: data['Gender'],
                    number: data['Phone Number'],
                    On_update: data['Last Updated'],
                    appointment_status: data['Appointment Status'],
                    navigator: data['Navigator'],
                    isActive: data['Is Active'],
                    created_on: data['Created On'],
                    member_status: data['Member Status'],
                    navigator_status: data['Navigator Status'],
                    doctor_status: data['Doctor Status'],
                    approve_status: data['Approval Status']
                };
                results.push(member);
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });

    try {
        // Wait for CSV parsing to complete
        const members = await parseCSV;
        
        // Create the final JSON structure
        const jsonData = {
            members: members
        };

        // Write to JSON file
        await fs.writeFile(
            path.join(__dirname, 'members_converted_back.json'),
            JSON.stringify(jsonData, null, 2)
        );

        console.log('JSON file has been created successfully at:', path.join(__dirname, 'members_converted_back.json'));
    } catch (error) {
        console.error('Error during conversion:', error);
    }
}

// First install required package
const { execSync } = require('child_process');
try {
    console.log('Installing required package: csv-parser...');
    execSync('npm install csv-parser', { stdio: 'inherit' });
    console.log('Package installed successfully');
    
    // Run the conversion
    convertCSVToJSON();
} catch (error) {
    console.error('Error installing package:', error);
}
