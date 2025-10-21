// Add logos
doc.image('./src/assets/images/eye_foundation.jpg', 50, 50, { width: 100 })
   .image('./src/assets/images/assist-health-logo.jpg', doc.page.width/2 - 50, 50, { width: 100 })
   .image('./src/assets/images/school.jpg', doc.page.width - 150, 50, { width: 100 });

// Add title with more spacing
doc.moveDown(4)  // Increased spacing after logos
   .font('Helvetica-Bold')
   .fontSize(24)
   .text('Student Health Assessment Report', {
       align: 'center',
       underline: true
   })
   .moveDown(3);  // Increased spacing after title

// Student Information Section with adjusted spacing
doc.font('Helvetica-Bold')
   .fontSize(16)
   .text('Student Information')
   .moveDown(1);  // Increased spacing

doc.font('Helvetica')
   .fontSize(12);

// Create two columns for student info with more spacing
const leftColumn = {
    'Student Name': data["Student's Name"],
    'Gender': data['GENDER'],
    'Grade / Class': data['GRADE  / CLASS'],
    'Section': data['SECTION']
};

const rightColumn = {
    'Date of Assessment': formatDate(data['DATE OF ASSESSMENT']),
    'School': data['SCHOOL'],
    'Contact Number': data['CONTACT NUMBER']
};

// Add left column with increased line spacing
let y = doc.y;
Object.entries(leftColumn).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 50, y);
    y += 25;  // Increased from 20 to 25 for better spacing
});

// Add right column with increased line spacing
y = doc.y - (Object.keys(leftColumn).length * 25);  // Adjusted for new spacing
Object.entries(rightColumn).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 300, y);
    y += 25;  // Increased from 20 to 25 for better spacing
});

// Vital Signs Section with more spacing
doc.moveDown(3)  // Increased spacing
   .font('Helvetica-Bold')
   .fontSize(16)
   .text('Vital Signs')
   .moveDown(1);

const vitalSigns = {
    'Height': `${data['HEIGHT (cm)']} cm`,
    'Weight': `${data['WEIGHT (Kgs)']} kg`,
    'BMI': data['BMI'].toFixed(2),
    'Temperature': `${data['TEMPERATURE  (F)']}°F`,
    'Pulse Rate': `${data['PULS RATE (b/p)']} bpm`,
    'SPO2': `${data['SPO2 (%)']}%`
};

Object.entries(vitalSigns).forEach(([key, value]) => {
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .text(`${key}:`, { continued: true })
       .font('Helvetica')
       .text(` ${value}`)
       .moveDown(0.8);  // Added spacing between vital signs
});

// Medical Assessment Section with more spacing
doc.moveDown(3)  // Increased spacing
   .font('Helvetica-Bold')
   .fontSize(16)
   .text('Medical Assessment')
   .moveDown(1);

const medicalAssessment = {
    'Vision': `R: ${formatDate(data['RIGHT EYE'])} | L: ${formatDate(data['LEFT EYE'])}`,
    'Hearing': data['HEARING'],
    'Dental': data['DENTAL'],
    'General': data['GENERAL'],
    'Comments': data['COMMENT']
};

Object.entries(medicalAssessment).forEach(([key, value]) => {
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .text(`${key}:`, { continued: true })
       .font('Helvetica')
       .text(` ${value}`)
       .moveDown(0.8);  // Added spacing between medical assessment items
});

// Add signatures section with more spacing
doc.moveDown(4);
const signatureY = doc.y;
doc.fontSize(12)
   .text('Doctor\'s Signature', 50, signatureY)
   .text('Parent\'s Signature', 400, signatureY);

// Add footer with proper spacing
const footerY = doc.page.height - 100;  // Increased margin from bottom
doc.fontSize(10)
   .text('Powered by AssistHealth', 50, footerY, { align: 'center' })
   .moveDown(0.8)
   .text('Phone: +91-9611232519 / 69 / 93', { align: 'center' })
   .moveDown(0.8)
   .text('Email: infoassisthealth@gmail.com', { align: 'center' })
   .moveDown(0.8)
   .text('Address: #850, 3rd Floor, D Block, Opp Cafe Coffee Day, Sahakar nagar, Bangalore 560092', { align: 'center' }); 