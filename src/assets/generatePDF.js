const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateHealthReport(data) {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    doc.pipe(fs.createWriteStream('health_report.pdf'));

    // Define colors for styling
    const primaryColor = '#2c3e50';
    const secondaryColor = '#34495e';
    const accentColor = '#3498db';
    const boxBgColor = '#f5f6fa';

    // Add logos
    doc.image('./src/assets/images/eye_foundation.jpg', 50, 50, { width: 100 })
       .image('./src/assets/images/assist-health-logo.jpg', doc.page.width/2 - 50, 50, { width: 100 })
       .image('./src/assets/images/school.jpg', doc.page.width - 150, 50, { width: 100 });

    // Title with more spacing
    doc.moveDown(6)
       .font('Helvetica-Bold')
       .fontSize(24)
       .fillColor(primaryColor)
       .text('Student Health Assessment Report', {
           align: 'center',
           underline: true
       })
       .moveDown(3);

    // Student Information with Age and AssistHealth ID in header
    const studentInfo = {
        'Student Name': data["Student's Name"],
        'Gender': data['GENDER'],
        'Date of Assessment': formatDate(data['DATE OF ASSESSMENT']),
        'Grade / Class': data['GRADE  / CLASS'],
        'Age': data['AGE'],
        'AssistHealth ID': data['ASSISTHEALTH_ID'],
        'School': data['SCHOOL'],
        'Section': data['SECTION']
    };

    addSection(doc, 'Student Information', studentInfo, boxBgColor, primaryColor, secondaryColor);
    doc.moveDown(1);

    // 2. Vital Signs Section
    const vitalSigns = {
        'Height': `${data['HEIGHT (cm)']} cm`,
        'Weight': `${data['WEIGHT (Kgs)']} kg`,
        'BMI': data['BMI'].toFixed(2),
        'Temperature': `${data['TEMPERATURE  (F)']}°F`,
        'Pulse Rate': `${data['PULS RATE (b/p)']} bpm`,
        'SPO2': `${data['SPO2 (%)']}%`,
        'Blood Pressure': data['BP'] || 'N/A'
    };

    addSection(doc, 'Vital Signs', vitalSigns, boxBgColor, primaryColor, secondaryColor);
    doc.moveDown(1);

    // 3. Vision & Hearing Section
    const visionHearing = {
        'Vision (Right Eye)': data['RIGHT EYE'] || 'N/A',
        'Vision (Left Eye)': data['LEFT EYE'] || 'N/A',
        'Vision Comments': data['VISION_COMMENTS'] || 'N/A',
        'Hearing': data['HEARING'] || 'N/A',
        'Hearing Comments': data['HEARING_COMMENTS'] || 'N/A'
    };

    addSection(doc, 'Vision & Hearing Assessment', visionHearing, boxBgColor, primaryColor, secondaryColor);
    doc.moveDown(1);

    // 4. Oral Health Section
    const oralHealth = {
        'Normal': data['DENTAL_NORMAL'] || 'N/A',
        'Decayed Teeth': data['DENTAL_DECAYED'] || 'N/A',
        'Dental Stains': data['DENTAL_STAINS'] || 'N/A',
        'Cross Bite': data['DENTAL_CROSSBITE'] || 'N/A',
        'Dentures': data['DENTAL_DENTURES'] || 'N/A',
        'Other Issues': data['DENTAL_OTHER'] || 'N/A'
    };

    addSection(doc, 'Oral Health Assessment', oralHealth, boxBgColor, primaryColor, secondaryColor);
    doc.moveDown(1);

    // 5. Additional Comments Section
    const comments = {
        'General Comments': data['COMMENT'] || 'No additional comments',
        'Other Concerns': data['OTHER_CONCERNS'] || 'None reported'
    };

    addSection(doc, 'Additional Comments', comments, boxBgColor, primaryColor, secondaryColor);
    doc.moveDown(1);

    // Signatures with proper spacing
    const signatureY = doc.y + 20;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(secondaryColor);

    // Add signature lines with more spacing
    doc.text('Doctor\'s Signature', 50, signatureY)
       .moveTo(50, signatureY + 30).lineTo(250, signatureY + 30).stroke()
       .text('Parent\'s Signature', 350, signatureY)
       .moveTo(350, signatureY + 30).lineTo(550, signatureY + 30).stroke();

    // Footer with adjusted position
    const footerY = doc.page.height - 100;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(accentColor)
       .text('Powered by AssistHealth', 50, footerY, { align: 'center' })
       .moveDown(0.5)
       .fillColor(secondaryColor)
       .text('Phone: +91-9611232519 / 69 / 93', { align: 'center' })
       .moveDown(0.5)
       .text('Email: infoassisthealth@gmail.com', { align: 'center' })
       .moveDown(0.5)
       .text('Address: #850, 3rd Floor, D Block, Opp Cafe Coffee Day, Sahakar nagar, Bangalore 560092', { align: 'center' });

    doc.end();
}

function addSection(doc, title, data, bgColor, primaryColor, secondaryColor) {
    doc.moveDown(1)
       .font('Helvetica-Bold')
       .fontSize(16)
       .fillColor(primaryColor)
       .text(title);

    // For Student Information section, handle Age and AssistHealth ID separately
    if (title === 'Student Information') {
        // Add Age and AssistHealth ID on the same line as the title
        const currentY = doc.y - 20; // Move back up to title line
        doc.fontSize(11)
           .text(`Age: ${data['Age'] || 'N/A'}`, 300, currentY)
           .text(`AssistHealth ID: ${data['AssistHealth ID'] || 'N/A'}`, 450, currentY);
        
        // Remove these fields from the main data object
        delete data['Age'];
        delete data['AssistHealth ID'];
        
        doc.moveDown(0.5);
    } else {
        doc.moveDown(0.5);
    }

    const sectionY = doc.y;
    const lineHeight = 25;
    const padding = 15;
    const entries = Object.entries(data);
    
    // Calculate height based on number of rows needed
    const rowsNeeded = Math.ceil(entries.length / (title === 'Student Information' ? 2 : 1));
    const sectionHeight = rowsNeeded * lineHeight + (padding * 2);

    // Add background box with padding
    doc.rect(50, sectionY - padding, doc.page.width - 100, sectionHeight)
       .fillColor(bgColor)
       .fill()
       .strokeColor(secondaryColor)
       .lineWidth(0.5)
       .stroke();

    // Reset position for content
    doc.y = sectionY;

    if (title === 'Student Information') {
        // Two-column layout for Student Information
        const midPoint = doc.page.width / 2;
        const leftCol = entries.slice(0, Math.ceil(entries.length / 2));
        const rightCol = entries.slice(Math.ceil(entries.length / 2));
        
        let startY = doc.y;
        
        // Left column
        leftCol.forEach(([key, value]) => {
            doc.y = startY;
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor(secondaryColor)
               .text(`${key}: `, 60, null, { continued: true, width: midPoint - 80 })
               .font('Helvetica')
               .fillColor(primaryColor)
               .text(`${value}`, { width: midPoint - 80 });
            startY = doc.y + lineHeight - 10;
        });

        // Right column
        startY = doc.y - (leftCol.length * lineHeight);
        rightCol.forEach(([key, value]) => {
            doc.y = startY;
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor(secondaryColor)
               .text(`${key}: `, midPoint, null, { continued: true, width: midPoint - 80 })
               .font('Helvetica')
               .fillColor(primaryColor)
               .text(`${value}`, { width: midPoint - 80 });
            startY = doc.y + lineHeight - 10;
        });
    } else {
        // Single row layout for other sections
        entries.forEach(([key, value]) => {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor(secondaryColor)
               .text(`${key}: `, 60, null, { continued: true })
               .font('Helvetica')
               .fillColor(primaryColor)
               .text(`${value}`, { width: doc.page.width - 180 })
               .moveDown(0.5);
        });
    }

    // Ensure proper spacing after section
    doc.y = sectionY + sectionHeight + padding;
}

// Helper function to format dates
function formatDate(excelDate) {
    if (!excelDate) return 'N/A';
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString();
}

// Read JSON and generate PDF
fs.readFile('src/assets/assessments.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("Error reading file:", err);
        return;
    }
    
    try {
        const data = JSON.parse(jsonString);
        generateHealthReport(data[0]);
    } catch(err) {
        console.log('Error parsing JSON:', err);
    }
}); 