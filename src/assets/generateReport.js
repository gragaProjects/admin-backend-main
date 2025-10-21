const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { generateHealthReportHTML } = require('./assets/generateHTML');

async function generatePDF(data, outputPath) {
    try {
        // Generate HTML content
        const htmlContent = generateHealthReportHTML(data);

        // Create a temporary HTML file
        const tempHtmlPath = path.join(__dirname, 'temp.html');
        fs.writeFileSync(tempHtmlPath, htmlContent);

        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: 'new'
        });
        const page = await browser.newPage();

        // Set content with base URL to resolve relative paths
        await page.goto(`file://${tempHtmlPath}`, {
            waitUntil: 'networkidle0'
        });

        // Inject images as base64
        await page.evaluate(async () => {
            const convertImageToBase64 = async (imgElement) => {
                try {
                    const response = await fetch(imgElement.src);
                    const blob = await response.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error('Error converting image:', error);
                    return '';
                }
            };

            const images = document.querySelectorAll('img');
            for (let img of images) {
                const base64 = await convertImageToBase64(img);
                if (base64) {
                    img.src = base64;
                }
            }
        });

        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            printBackground: true
        });

        // Close browser and cleanup
        await browser.close();
        fs.unlinkSync(tempHtmlPath);

        console.log(`PDF generated successfully at: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        return false;
    }
}

// Make sure images exist and paths are correct
const validateImages = () => {
    const requiredImages = [
        'eye_foundation.jpg',
        'assist-health-logo.jpg',
        'school.jpg'
    ];

    const imagesPath = path.join(__dirname, 'images');
    
    // Create images directory if it doesn't exist
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
        console.log('Created images directory');
    }

    // Check for missing images
    const missingImages = requiredImages.filter(img => 
        !fs.existsSync(path.join(imagesPath, img))
    );

    if (missingImages.length > 0) {
        console.error('Missing required images:', missingImages);
        console.log('Please place the following images in', imagesPath);
        return false;
    }
    return true;
}

// Read JSON file and generate PDF
fs.readFile(path.join(__dirname, './assessments.json'), 'utf8', async (err, jsonString) => {
    if (err) {
        console.log("Error reading file:", err);
        return;
    }
    
    try {
        // Validate images first
        if (!validateImages()) {
            return;
        }

        const data = JSON.parse(jsonString);
        const outputPath = path.join(__dirname, 'health_report.pdf');
        await generatePDF(data[0], outputPath);
    } catch(err) {
        console.log('Error parsing JSON:', err);
    }
}); 