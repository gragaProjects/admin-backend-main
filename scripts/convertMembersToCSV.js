const fs = require('fs').promises;
const path = require('path');
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;

async function convertMembersToCSV() {
    try {
        // Read the JSON file
        const jsonData = await fs.readFile(path.join(__dirname, 'members.json'), 'utf8');
        const data = JSON.parse(jsonData);
        
        // Define CSV writer
        const csvWriter = createObjectCsvWriter({
            path: path.join(__dirname, 'members_exported.csv'),
            header: [
                { id: 'member_id', title: 'Member ID' },
                { id: 'name', title: 'Name' },
                { id: 'email', title: 'Email' },
                { id: 'gender', title: 'Gender' },
                { id: 'number', title: 'Phone Number' },
                { id: 'On_update', title: 'Last Updated' },
                { id: 'appointment_status', title: 'Appointment Status' },
                { id: 'navigator', title: 'Navigator' },
                { id: 'isActive', title: 'Is Active' },
                { id: 'created_on', title: 'Created On' },
                { id: 'member_status', title: 'Member Status' },
                { id: 'navigator_status', title: 'Navigator Status' },
                { id: 'doctor_status', title: 'Doctor Status' },
                { id: 'approve_status', title: 'Approval Status' }
            ]
        });

        // Write records to CSV
        await csvWriter.writeRecords(data.members);
        console.log('CSV file has been created successfully at:', path.join(__dirname, 'members_exported.csv'));

    } catch (error) {
        console.error('Error during conversion:', error);
    }
}

// First install required package
const { execSync } = require('child_process');
try {
    console.log('Installing required package: csv-writer...');
    execSync('npm install csv-writer', { stdio: 'inherit' });
    console.log('Package installed successfully');
    
    // Run the conversion
    convertMembersToCSV();
} catch (error) {
    console.error('Error installing package:', error);
}
