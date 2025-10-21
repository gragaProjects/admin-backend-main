const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const S3Service = require('./s3');
const { Member, School, Doctor } = require('../models');

class PdfService {
  async createPdf(htmlContent) {
    return new Promise((resolve, reject) => {
      try {
        // Create a document
        const doc = new PDFDocument();
        const chunks = [];

        // Capture all chunks in memory
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Parse the HTML-like template strings into PDF content
        const lines = htmlContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);

        // Set initial position
        let y = 50;

        // Process each line
        lines.forEach(line => {
          if (line.startsWith('<h1>')) {
            doc.fontSize(24);
            doc.text(line.replace(/<\/?h1>/g, ''), 50, y);
            y += 40;
          } else if (line.startsWith('<h2>')) {
            doc.fontSize(14);
            doc.text(line.replace(/<\/?h2>/g, ''), 50, y);
            y += 25;
          }

          // Add a new page if we're near the bottom
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }


  // Function to generate PDF and save it
  async generatePDF(html, filename, options = {}) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set content with base styles
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF with provided settings or defaults
        const pdfOptions = {
            printBackground: true,
            ...options
        };
        
        const buffer = await page.pdf(pdfOptions);

        // Upload PDF to S3
        // If S3Service is exported as an instance
        const pdfUrl = await S3Service.uploadPdf(buffer, filename);
        console.log(`pdfUrl: ${pdfUrl}`);
        
        return {
            buffer,
            pdfUrl
        };
    } catch (error) {
        console.error('PDF Generation Error Details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
  }

  async generateAssessmentPdf(assessment, res) {
    try {
      const student = await Member.findById(assessment.studentId);
      const school = await School.findById(assessment.schoolId);

      const formData = {
          studentInfo: {
              name: assessment.name,
              assessmentDate: new Date().toISOString().split('T')[0],
              age: Math.floor((new Date() - new Date(student.dob)) / (365.25 * 24 * 60 * 60 * 1000)),
              schoolName: student.studentDetails.schoolName,
              gender: student.gender,
              grade: student.studentDetails.grade,
              assistHealthId: student.memberId,
              section: student.studentDetails.section
          },
          vitalSigns: {
              height: assessment.heightInCm,
              weight: assessment.weightInKg,
              bmi: assessment.bmi,
              temperature: assessment.temperatureInFahrenheit,
              pulse: assessment.pulseRateBpm,
              spO2: assessment.spo2Percentage,
              bp: assessment.bp
          },
          vision: {
              right: assessment.visionLeft,
              left: assessment.visionRight,
              comment: assessment.visionComments
          },
          hearing: {
              comments: assessment.hearingComments
          },
          oralHealth: {
              normal: assessment.oralHealth === 'normal',
              decayed: assessment.oralHealth === 'decayed',
              dentalStrains: assessment.oralHealth === 'dentalStrains', 
              crossBite: assessment.oralHealth === 'crossBite',
              dentures: assessment.oralHealth === 'dentures',
              otherIssues: assessment.dentalIssues || 'no issues'
          },
          additionalComments: assessment.additionalComments,
          signatures: {
              nurseSignature: {
                  path: assessment.nurseSignature,
                  name: '',
                  designation: ''
              },
              doctorSignature: {
                  path: assessment.doctorSignature,
                  name: '',
                  designation: ''
              }
          }
      }; 

      return new Promise((resolve, reject) => {
          res.render('assessment_report', formData, async (err, html) => {
              if (err) {
                  console.error('Template Render Error:', err);
                  reject(err);
                  return;
              }

              try {
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                  const filename = `health-assessment-${formData.studentInfo.name}-${timestamp}.pdf`;
                  
                  const { pdfUrl } = await this.generatePDF(html, filename);
                  
                  resolve({
                      success: true,
                      message: 'PDF generated successfully', 
                      s3Url: pdfUrl
                  });
              } catch (error) {
                  console.error('PDF Generation Error:', error);
                  reject(error);
              }
          });
      });
    } catch (error) {
        console.error('Main Route Error:', error);
        res.status(500).send('Server error: ' + error.message);
    }
  }

  async generateAppointmentPdf(appointment, res) {
    try {
      const member = await Member.findById(appointment.memberId);
      const doctor = await Doctor.findById(appointment.doctorId);
      
      const appointmentFormData = {
          name: member.name || "Patient Name",
          memberId: member.memberId || "MEM123456",
          appointmentDetails: appointment.service || "Regular Checkup",
          appointmentTime: appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : "10:00 AM",
          appointmentDate: appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : "Mar 20, 2024",
          doctorName: doctor.name || "NA",
          doctorSpecialization: doctor.specializations ? doctor.specializations.join(' | ') : "NA",
          hospitalName: appointment.hospitalName || "NA",
          hospitalAddress: appointment.hospitalAddress || "Not Yet Added"
      };

      return new Promise((resolve, reject) => {
          res.render('appointment_confirmation', appointmentFormData, async (err, html) => {
              if (err) {
                  console.error('Template Render Error:', err);
                  reject(err);
                  return;
              }

              try {
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                  const filename = `${member.name}-${timestamp}.pdf`;
                  
                  const { pdfUrl } = await this.generatePDF(html, filename);
                  
                  resolve({
                      success: true,
                      message: 'PDF generated successfully', 
                      s3Url: pdfUrl
                  });
              } catch (error) {
                  console.error('PDF Generation Error:', error);
                  reject(error);
              }
          });
      });

    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }

  async generateMembershipCardPdf(memberData, res) {
    try {
        // Prepare the form data for the membership card
        const membershipFormData = {
            memberName: memberData.name || "Member Name",
            assistHealthId: memberData.memberId || "AH123456",
            validDate: memberData.validDate ? new Date(memberData.validDate).toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : "Not Specified"
        };

        return new Promise((resolve, reject) => {
            // Use the existing membership_card.ejs template
            res.render('membership_card', membershipFormData, async (err, html) => {
                if (err) {
                    console.error('Template Render Error:', err);
                    reject(err);
                    return;
                }

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `membership-card-${membershipFormData.memberName}-${timestamp}.pdf`;
                    
                    // Use the existing generatePDF method to create and upload the PDF
                    const { pdfUrl } = await this.generatePDF(html, filename, {
                        // Specific options for membership card PDF
                        width: '85.6mm',
                        height: '53.98mm',
                        printBackground: true,
                        margin: {
                            top: '0',
                            right: '0',
                            bottom: '0',
                            left: '0'
                        }
                    });
                    
                    resolve({
                        success: true,
                        message: 'Membership card PDF generated successfully', 
                        s3Url: pdfUrl
                    });
                } catch (error) {
                    console.error('PDF Generation Error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Membership Card Generation Error:', error);
        throw error;
    }
  }

  async generateNavigatorProfilePdf(navigatorData, res) {
    try {
        // Prepare the form data for the navigator profile
        const navigatorFormData = {
            navigatorName: navigatorData.name || "Karen Dawson",
            title:navigatorData.role || "Navigator",
            navigatorId: navigatorData.navigatorId || "AHNAV000",
            phone: navigatorData.phone || "+919876543210",
            languages: navigatorData.languagesSpoken || "English, Tamil, Telugu",
            biography: navigatorData.introduction || "Dr. Karen Dawson is a board-certified pediatrician",
            profilePic: navigatorData.profilePic ||"https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740"
        };

        return new Promise((resolve, reject) => {
            // Use the existing navigator-profile.ejs template
            res.render('navigator-profile', navigatorFormData, async (err, html) => {
                if (err) {
                    console.error('Template Render Error:', err);
                    reject(err);
                    return;
                }

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `navigator-profile-${navigatorFormData.name}-${timestamp}.pdf`;
                    
                    // Use the existing generatePDF method to create and upload the PDF
                    const { pdfUrl } = await this.generatePDF(html, filename, {
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '20mm',
                            right: '20mm',
                            bottom: '20mm',
                            left: '20mm'
                        }
                    });
                    
                    resolve({
                        success: true,
                        message: 'Navigator profile PDF generated successfully', 
                        s3Url: pdfUrl
                    });
                } catch (error) {
                    console.error('PDF Generation Error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Navigator Profile Generation Error:', error);
        throw error;
    }
  }

  async generateNurseProfilePdf(nurseData, res) {
    try {
        // Prepare the form data for the nurse profile
        const nurseFormData = {
            nurseName: nurseData.name || "Jordan MC",
            title: nurseData.role || "Nurse",
            nurseId: nurseData.nurseId || "AHNUR000",
            hospital: nurseData.schoolId.name || "Medic General Medical Hospital",
            phone: nurseData.phone || "+919876543210",
            languages: nurseData.languagesSpoken || "English, Spanish",
            biography: nurseData.introduction || "Dr. Karen Dawson is a board-certified pediatrician",
            profilePic: nurseData.profilePic || "https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740"
        };

        return new Promise((resolve, reject) => {
            // Use the nurse-profile.ejs template
            res.render('nurse-profile', nurseFormData, async (err, html) => {
                if (err) {
                    console.error('Template Render Error:', err);
                    reject(err);
                    return;
                }

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `nurse-profile-${nurseFormData.nurseName}-${timestamp}.pdf`;
                    
                    // Use the existing generatePDF method to create and upload the PDF
                    const { pdfUrl } = await this.generatePDF(html, filename, {
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '20mm',
                            right: '20mm',
                            bottom: '20mm',
                            left: '20mm'
                        }
                    });
                    
                    resolve({
                        success: true,
                        message: 'Nurse profile PDF generated successfully', 
                        s3Url: pdfUrl
                    });
                } catch (error) {
                    console.error('PDF Generation Error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Nurse Profile Generation Error:', error);
        throw error;
    }
}

async generateDoctorProfilePdf(doctorData, res) {
    try {
        // Prepare the form data for the doctor profile
        const doctorFormData = {
            doctorName: doctorData.name || "Dr. Sarah Johnson",
            title: doctorData.role || "Pediatric Surgeon",
            credentials: doctorData.qualification?.join(", ") || "MBBS, MS (Surgery)",
            location: `${doctorData.offlineAddress?.description || ''}, ${doctorData.offlineAddress?.region || ''}, ${doctorData.offlineAddress?.state || ''}, ${doctorData.offlineAddress?.country || 'Banglore, Karnataka, India'}`,
            doctorId: doctorData.doctorId || "D-12345",
            phone: doctorData.phone || "+1 (555) 987-6543",
            languages: doctorData.languagesSpoken?.join(", ") || "English, Spanish",
            biography: doctorData.introduction || "Dr. Sarah Johnson is a highly skilled pediatric surgeon with extensive experience in minimally invasive procedures.",
            doctorImage: doctorData.profilePic || "https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg?semt=ais_hybrid&w=740",
            specialities: doctorData.specializations || ["General Medicine"],
            experience: doctorData.experience || "10+ years",
            typeOf: doctorData.typeOf || "Full-time"
        };

        return new Promise((resolve, reject) => {
            // Use the doctor-profile.ejs template
            res.render('doctor-profile', doctorFormData, async (err, html) => {
                if (err) {
                    console.error('Template Render Error:', err);
                    reject(err);
                    return;
                }

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `doctor-profile-${doctorFormData.doctorName}-${timestamp}.pdf`;
                    
                    // Use the existing generatePDF method to create and upload the PDF
                    const { pdfUrl } = await this.generatePDF(html, filename, {
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '20mm',
                            right: '20mm',
                            bottom: '20mm',
                            left: '20mm'
                        }
                    });
                    
                    resolve({
                        success: true,
                        message: 'Doctor profile PDF generated successfully', 
                        s3Url: pdfUrl
                    });
                } catch (error) {
                    console.error('PDF Generation Error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Doctor Profile Generation Error:', error);
        throw error;
    }
}
}

module.exports = new PdfService();
