const XLSX = require('xlsx');
const fs = require('fs');

// Function to read Excel file and convert to JSON
function convertExcelToJson() {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile('src/assets/Assesment report.xlsx');
        
        // Array to store all worksheets data
        const allAssessments = [];
        
        // Iterate through each worksheet
        workbook.SheetNames.forEach(sheetName => {
            // Convert worksheet to JSON
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Add worksheet data to the main array
            allAssessments.push(...jsonData);
        });

        // Write the combined data to a JSON file
        fs.writeFileSync(
            'src/assets/assessments.json',
            JSON.stringify(allAssessments, null, 2)
        );

        console.log('Successfully converted Excel to JSON!');
        return allAssessments;

    } catch (error) {
        console.error('Error converting Excel to JSON:', error);
        throw error;
    }
}

// Execute the conversion
convertExcelToJson(); 