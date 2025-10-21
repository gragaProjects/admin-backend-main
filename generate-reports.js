const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

// Read the JSON data
const assessmentsData = require('./src/assets/assessments.json');

// Create output directory if it doesn't exist
const outputDir = './student-reports';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Logo path
const logoPath = path.join(__dirname, 'src/assets/images/assist-health-logo.jpg');

// Function to generate PDF for a student
async function generateStudentReport(student) {
    if (!student["Student's Name"]) return;

    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    // Create file name from student name (remove special characters and spaces)
    const fileName = student["Student's Name"].replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    const outputPath = path.join(outputDir, fileName);

    // Pipe the PDF document to a write stream
    doc.pipe(fs.createWriteStream(outputPath));

    // Header section with logos and title
    doc.image(logoPath, 50, 30, { width: 80 });  // Smaller logo
    
    // School logo could be added here on the right if available
    // doc.image(schoolLogoPath, 470, 30, { width: 80 });

    // Title with better spacing and styling
    doc.moveDown(3);
    doc.fontSize(24).font('Helvetica-Bold').text('Student Health Assessment Report', {
        align: 'center',
        color: '#2b3a6b'  // Dark blue color for title
    });
    doc.moveDown(1);

    // Student Information section
    doc.fontSize(16).font('Helvetica-Bold')
       .fillColor('#2b3a6b')
       .text('Student Information', { underline: true });
    doc.moveDown(0.5);

    // Create two-column layout for student details
    const leftColumn = [
        ["Student's Name", student["Student's Name"]],
        ["Grade / Class", student["GRADE  / CLASS"]],
        ["Gender", student["GENDER"]],
        ["Date of Assessment", formatDate(student["DATE OF ASSESSMENT"])]
    ];

    const rightColumn = [
        ["School", student["SCHOOL"]],
        ["Section", student["SECTION"]],
        ["AssistHealth ID", student["ASSIST_ID"] || "NA"],
        ["Parent Name", student["PARENT NAME"]]
    ];

    // Draw light background for entire info section
    const infoStartY = doc.y;
    doc.rect(45, infoStartY - 5, 500, 100)
       .fill('#f5f5f5');

    // Add columns with proper spacing
    doc.fontSize(11).font('Helvetica');
    let currentY = infoStartY;

    leftColumn.forEach(([label, value]) => {
        doc.fillColor('#2b3a6b').text(label + ":", 50, currentY, { continued: true, width: 100 });
        doc.fillColor('#000000').text(value || "NA", 150, currentY);
        currentY += 20;
    });

    currentY = infoStartY;
    rightColumn.forEach(([label, value]) => {
        doc.fillColor('#2b3a6b').text(label + ":", 300, currentY, { continued: true, width: 100 });
        doc.fillColor('#000000').text(value || "NA", 400, currentY);
        currentY += 20;
    });

    // Vital Signs section
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold')
       .fillColor('#2b3a6b')
       .text('Vital Signs', { underline: true });
    doc.moveDown(0.5);

    const vitalsStartY = doc.y;
    doc.rect(45, vitalsStartY - 5, 500, 80)
       .fill('#f0f7ff');  // Light blue background

    const vitals = [
        ["Height", student["HEIGHT (cm)"], "cm"],
        ["Weight", student["WEIGHT (Kgs)"], "kg"],
        ["BMI", student["BMI"], ""],
        ["Temperature", student["TEMPERATURE  (F)"], "°F"],
        ["Pulse Rate", student["PULS RATE (b/p)"], "bpm"],
        ["SPO2", student["SPO2 (%)"], "%"]
    ];

    // Display vitals in two columns
    let col1Y = vitalsStartY;
    let col2Y = vitalsStartY;
    vitals.forEach((vital, index) => {
        const [label, value, unit] = vital;
        const y = index < 3 ? col1Y : col2Y;
        const x = index < 3 ? 50 : 300;
        const valueX = index < 3 ? 150 : 400;

        doc.fontSize(11).font('Helvetica-Bold')
           .fillColor('#2b3a6b')
           .text(label + ":", x, y, { continued: true, width: 100 });
        doc.font('Helvetica')
           .fillColor('#000000')
           .text(`${value || "NA"} ${unit}`, valueX, y);

        if (index < 3) col1Y += 20;
        else col2Y += 20;
    });

    // Vision Assessment
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold')
       .fillColor('#2b3a6b')
       .text('Vision Assessment', { underline: true });
    doc.moveDown(0.5);

    const visionStartY = doc.y;
    doc.rect(45, visionStartY - 5, 500, 50)
       .fill('#fff0f0');  // Light red background

    doc.fontSize(11).font('Helvetica');
    doc.fillColor('#2b3a6b').text("Right Eye:", 50, visionStartY, { continued: true, width: 100 });
    doc.fillColor('#000000').text(student["RIGHT EYE"] || "NA", 150, visionStartY);
    doc.fillColor('#2b3a6b').text("Left Eye:", 300, visionStartY, { continued: true, width: 100 });
    doc.fillColor('#000000').text(student["LEFT EYE"] || "NA", 400, visionStartY);

    // Additional Comments section
    if (student["COMMENT"]) {
        doc.moveDown(2);
        doc.fontSize(16).font('Helvetica-Bold')
           .fillColor('#2b3a6b')
           .text('Additional Comments', { underline: true });
        doc.moveDown(0.5);

        const commentStartY = doc.y;
        doc.rect(45, commentStartY - 5, 500, 60)
           .fill('#f5f5f5');
        
        doc.fontSize(11).font('Helvetica')
           .fillColor('#000000')
           .text(student["COMMENT"], 50, commentStartY, {
                width: 490,
                align: 'left'
           });
    }

    // Add Signatures section
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold')
       .fillColor('#2b3a6b')
       .text('Signatures', { underline: true });
    doc.moveDown(0.5);

    const signatureStartY = doc.y;
    doc.rect(45, signatureStartY - 5, 500, 100)
       .fill('#f5f5f5');

    // Left signature box (School Health Doctor)
    doc.rect(50, signatureStartY, 230, 80)
       .stroke('#2b3a6b');
    doc.fontSize(11).font('Helvetica')
       .fillColor('#2b3a6b')
       .text('School Health Doctor\'s Signature', 60, signatureStartY + 5);
    doc.fontSize(9)
       .text('Date: _________________', 60, signatureStartY + 55);
    
    // Right signature box (Parent/Guardian)
    doc.rect(315, signatureStartY, 230, 80)
       .stroke('#2b3a6b');
    doc.fontSize(11)
       .text('Parent/Guardian\'s Signature', 325, signatureStartY + 5);
    doc.fontSize(9)
       .text('Date: _________________', 325, signatureStartY + 55);

    // Contact Information section
    doc.moveDown(4);  // Add more space before contact info
    
    // Add a line above contact details
    doc.moveTo(45, doc.y)
       .lineTo(545, doc.y)
       .stroke('#2b3a6b');
    
    doc.moveDown(0.5);

    // Contact information with icons or symbols
    const contactInfo = {
        address: "123 Healthcare Avenue, Medical District, City - 123456",
        phone: "+91 1234567890",
        email: "info@assisthealth.com",
        website: "www.assisthealth.com"
    };

    // Create a footer table layout
    doc.fontSize(8).font('Helvetica');
    
    // First row: Address and Phone
    doc.fillColor('#2b3a6b')
       .text('📍', 50, doc.y, { continued: true })
       .fillColor('#666666')
       .text(` ${contactInfo.address}`, { continued: true, width: 250 })
       .fillColor('#2b3a6b')
       .text('📞', { continued: true })
       .fillColor('#666666')
       .text(` ${contactInfo.phone}`, { align: 'right' });

    // Second row: Email and Website
    doc.moveDown(0.5);
    doc.fillColor('#2b3a6b')
       .text('✉️', 50, doc.y, { continued: true })
       .fillColor('#666666')
       .text(` ${contactInfo.email}`, { continued: true, width: 250 })
       .fillColor('#2b3a6b')
       .text('🌐', { continued: true })
       .fillColor('#666666')
       .text(` ${contactInfo.website}`, { align: 'right' });

    // Powered by text
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica')
       .fillColor('#666666')
       .text('Powered by AssistHealth', {
            align: 'center',
            width: 500
       });

    // Finalize the PDF
    doc.end();
}

// Helper function to format Excel date number to readable date
function formatDate(excelDate) {
    if (!excelDate) return '';
    // Excel date serial numbers start from December 30, 1899
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString();
}

// Generate reports for all students
async function generateAllReports() {
    console.log('Starting report generation...');
    let count = 0;

    for (const student of assessmentsData) {
        try {
            await generateStudentReport(student);
            count++;
            if (count % 100 === 0) {
                console.log(`Generated ${count} reports...`);
            }
        } catch (error) {
            console.error(`Error generating report for ${student["Student's Name"]}:`, error);
        }
    }

    console.log(`Completed! Generated ${count} reports in ${outputDir}`);
}

// Run the script
generateAllReports().catch(console.error); 