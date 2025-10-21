const path = require('path');

function generateHealthReportHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #2c3e50;
                max-width: 21cm;
                min-height: 29.7cm;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .logo {
                width: 80px;
                height: auto;
            }
            
            .title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                margin: 20px 0;
                text-decoration: underline;
                color: #2c3e50;
            }
            
            .section {
                margin: 10px 0;
                padding: 10px 15px;
                background-color: #f5f6fa;
                border-radius: 5px;
                border: 1px solid #dcdde1;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .section-metadata {
                font-size: 12px;
                color: #34495e;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .info-item {
                display: flex;
                gap: 5px;
                font-size: 12px;
            }
            
            .info-label {
                font-weight: bold;
                color: #34495e;
                min-width: 120px;
            }
            
            .info-value {
                color: #2c3e50;
            }
            
            .signatures {
                display: flex;
                justify-content: space-between;
                margin: 15px 0;
            }
            
            .signature-line {
                width: 150px;
                border-top: 1px solid #34495e;
                margin-top: 10px;
                text-align: center;
                padding-top: 5px;
                color: #34495e;
                font-size: 12px;
            }
            
            .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 10px;
                color: #34495e;
            }

            .footer p {
                margin: 2px 0;
            }

            /* Make Additional Comments section single column */
            .section.comments .info-grid {
                grid-template-columns: 1fr;
            }

            /* Adjust spacing for vital signs to fit better */
            .vital-signs .info-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="${path.join(__dirname, 'images', 'eye_foundation.jpg')}" class="logo" alt="Eye Foundation Logo">
            <img src="${path.join(__dirname, 'images', 'assist-health-logo.jpg')}" class="logo" alt="AssistHealth Logo">
            <img src="${path.join(__dirname, 'images', 'school.jpg')}" class="logo" alt="School Logo">
        </div>

        <h1 class="title">Student Health Assessment Report</h1>

        <div class="section">
            <div class="section-header">
                <div class="section-title">Student Information</div>
                <div class="section-metadata">
                    Age: ${data.AGE || 'N/A'} | AssistHealth ID: ${data.ASSISTHEALTH_ID || 'N/A'}
                </div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value">${data["Student's Name"]}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${data.GENDER}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date of Assessment:</span>
                    <span class="info-value">${formatDate(data['DATE OF ASSESSMENT'])}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Grade / Class:</span>
                    <span class="info-value">${data['GRADE  / CLASS']}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">School:</span>
                    <span class="info-value">${data.SCHOOL}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Section:</span>
                    <span class="info-value">${data.SECTION}</span>
                </div>
            </div>
        </div>

        <div class="section vital-signs">
            <div class="section-title">Vital Signs</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Height:</span>
                    <span class="info-value">${data['HEIGHT (cm)']} cm</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Weight:</span>
                    <span class="info-value">${data['WEIGHT (Kgs)']} kg</span>
                </div>
                <div class="info-item">
                    <span class="info-label">BMI:</span>
                    <span class="info-value">${data.BMI?.toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Temperature:</span>
                    <span class="info-value">${data['TEMPERATURE  (F)']}°F</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Pulse Rate:</span>
                    <span class="info-value">${data['PULS RATE (b/p)']} bpm</span>
                </div>
                <div class="info-item">
                    <span class="info-label">SPO2:</span>
                    <span class="info-value">${data['SPO2 (%)']}%</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Blood Pressure:</span>
                    <span class="info-value">${data.BP || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Vision & Hearing Assessment</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Vision (Right):</span>
                    <span class="info-value">${data['RIGHT EYE'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Vision (Left):</span>
                    <span class="info-value">${data['LEFT EYE'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Vision Comments:</span>
                    <span class="info-value">${data['VISION_COMMENTS'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Hearing:</span>
                    <span class="info-value">${data['HEARING'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Hearing Comments:</span>
                    <span class="info-value">${data['HEARING_COMMENTS'] || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Oral Health Assessment</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Normal:</span>
                    <span class="info-value">${data['DENTAL_NORMAL'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Decayed Teeth:</span>
                    <span class="info-value">${data['DENTAL_DECAYED'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dental Stains:</span>
                    <span class="info-value">${data['DENTAL_STAINS'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Cross Bite:</span>
                    <span class="info-value">${data['DENTAL_CROSSBITE'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dentures:</span>
                    <span class="info-value">${data['DENTAL_DENTURES'] || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Other Issues:</span>
                    <span class="info-value">${data['DENTAL_OTHER'] || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="section comments">
            <div class="section-title">Additional Comments</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">General Comments:</span>
                    <span class="info-value">${data['COMMENT'] || 'No additional comments'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Other Concerns:</span>
                    <span class="info-value">${data['OTHER_CONCERNS'] || 'None reported'}</span>
                </div>
            </div>
        </div>

        <div class="signatures">
            <div class="signature-line">Doctor's Signature</div>
            <div class="signature-line">Parent's Signature</div>
        </div>

        <div class="footer">
            <p><strong>Powered by AssistHealth</strong></p>
            <p>Phone: +91-9611232519 / 69 / 93</p>
            <p>Email: infoassisthealth@gmail.com</p>
            <p>Address: #850, 3rd Floor, D Block, Opp Cafe Coffee Day, Sahakar nagar, Bangalore 560092</p>
        </div>
    </body>
    </html>
    `;
}

function formatDate(excelDate) {
    if (!excelDate) return 'N/A';
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString();
}

module.exports = { generateHealthReportHTML }; 