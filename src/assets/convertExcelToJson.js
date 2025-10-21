const XLSX = require('xlsx');
const fs = require('fs');

function convertExcelToJson(excelFile) {
    try {
        // Read Excel file
        const workbook = XLSX.readFile(excelFile);
        
        // Initialize array for all students
        let allStudents = [];
        
        // Process each worksheet
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert worksheet to JSON
            let data = XLSX.utils.sheet_to_json(worksheet);
            
            // Skip empty worksheets
            if (data.length === 0) return;
            
            // Process students in this worksheet
            const studentsInSheet = data.map(row => {
                const student = {};
                
                // Add class information from sheet name
                student['class'] = sheetName;
                
                // Process each field and standardize the data
                Object.keys(row).forEach(key => {
                    // Clean key name (remove spaces, lowercase)
                    const cleanKey = key.trim().toLowerCase().replace(/[\s\/]+/g, '_');
                    let value = row[key];
                    
                    // Handle different data types
                    if (value === undefined || value === null || value === 'NA') {
                        value = null;
                    } else if (value instanceof Date) {
                        value = value.toISOString().split('T')[0]; // YYYY-MM-DD format
                    } else if (typeof value === 'number') {
                        // Handle phone numbers and other numeric fields
                        if (cleanKey.includes('contact') || cleanKey.includes('phone') || cleanKey.includes('mobile')) {
                            value = Math.floor(value).toString();
                        } else if (cleanKey.includes('date')) {
                            // Convert Excel date number to YYYY-MM-DD
                            const date = XLSX.SSF.parse_date_code(value);
                            value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                        } else {
                            value = Number.isInteger(value) ? parseInt(value) : parseFloat(value);
                        }
                    } else {
                        value = String(value).trim();
                    }
                    
                    student[cleanKey] = value;
                });
                
                return student;
            });
            
            // Add students from this worksheet to the main array
            allStudents = allStudents.concat(studentsInSheet);
        });
        
        // Sort students by sl_no if it exists
        allStudents.sort((a, b) => {
            if (a.sl_no && b.sl_no) {
                return a.sl_no - b.sl_no;
            }
            return 0;
        });
        
        // Write to JSON file
        const outputFile = 'students_data.json';
        fs.writeFileSync(
            outputFile,
            JSON.stringify({ students: allStudents }, null, 2),
            'utf8'
        );
        
        console.log(`Successfully converted Excel data to ${outputFile}`);
        console.log(`Total number of students processed: ${allStudents.length}`);
        return true;
        
    } catch (error) {
        console.error(`Error converting Excel to JSON: ${error.message}`);
        return false;
    }
}

// Example usage
const excelFile = "src/assets/studentdata.xlsx";
convertExcelToJson(excelFile); 