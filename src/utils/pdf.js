const PDFDocument = require('pdfkit');

class PDFService {
  static generatePrescription(prescription, stream) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        doc.pipe(stream);

        // Add header
        doc.fontSize(20).text('Medical Prescription', { align: 'center' });
        doc.moveDown();

        // Add prescription details
        doc.fontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Diagnosis: ${prescription.diagnosis}`);
        doc.moveDown();

        // Add medicines
        doc.text('Medicines:', { underline: true });
        prescription.medicines.forEach(medicine => {
          doc.moveDown(0.5);
          doc.text(`- ${medicine.name}`);
          doc.text(`  Dosage: ${medicine.dosage}`);
          doc.text(`  Frequency: ${medicine.frequency}`);
          doc.text(`  Duration: ${medicine.duration}`);
        });

        doc.moveDown();
        doc.text(`Additional Instructions: ${prescription.additionalInstructions}`);

        // Finalize PDF
        doc.end();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService; 