const XLSX = require('xlsx');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const fs = require('fs');
const path = require('path');

class ExcelService {
  /**
   * Convert JSON data to Excel file
   * @param {Array} data - Array of objects to convert
   * @param {string} sheetName - Name of the worksheet
   * @param {string} outputPath - Path to save the file
   * @returns {string} Path of the generated file
   */
  async jsonToExcel(data, sheetName = 'Sheet1', outputPath) {
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate output path if not provided
      if (!outputPath) {
        const timestamp = Date.now();
        outputPath = path.join(__dirname, '..', '..', 'temp', `report_${timestamp}.xlsx`);
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to file
      XLSX.writeFile(workbook, outputPath);
      return outputPath;
    } catch (error) {
      console.error('Excel generation error:', error);
      throw error;
    }
  }

  /**
   * Read Excel file and convert to JSON
   * @param {string} filePath - Path to Excel file
   * @param {string} sheetName - Name of the worksheet to read (optional)
   * @returns {Array} Array of objects
   */
  async excelToJson(filePath, sheetName = null) {
    try {
      // Read workbook
      const workbook = XLSX.readFile(filePath);

      // Get sheet name if not provided
      const sheet = sheetName || workbook.SheetNames[0];

      // Convert to JSON
      const worksheet = workbook.Sheets[sheet];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw error;
    }
  }

  /**
   * Process bulk data from Excel file
   * @param {string} filePath - Path to Excel file
   * @param {Function} processRow - Function to process each row
   * @param {Object} options - Processing options
   * @returns {Object} Processing results
   */
  async processBulkData(filePath, processRow, options = {}) {
    const {
      batchSize = 100,
      sheetName = null,
      validateRow = null
    } = options;

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      const data = await this.excelToJson(filePath, sheetName);
      results.total = data.length;

      // Process in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchPromises = batch.map(async (row, index) => {
          try {
            // Validate row if validator provided
            if (validateRow) {
              const validationError = validateRow(row);
              if (validationError) {
                throw new Error(validationError);
              }
            }

            // Process row
            await processRow(row);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              row: i + index + 2, // +2 because Excel rows start at 1 and header row
              data: row,
              error: error.message
            });
          }
        });

        await Promise.all(batchPromises);
      }

      return results;
    } catch (error) {
      console.error('Bulk processing error:', error);
      throw error;
    }
  }

  /**
   * Generate error report for failed records
   * @param {Array} errors - Array of error objects
   * @returns {string} Path to error report file
   */
  async generateErrorReport(errors) {
    try {
      const timestamp = Date.now();
      const outputPath = path.join(__dirname, '..', '..', 'temp', `error_report_${timestamp}.xlsx`);

      const errorData = errors.map(error => ({
        Row: error.row,
        Error: error.error,
        ...error.data
      }));

      return this.jsonToExcel(errorData, 'Errors', outputPath);
    } catch (error) {
      console.error('Error report generation failed:', error);
      throw error;
    }
  }

  /**
   * Convert CSV to Excel
   * @param {string} csvPath - Path to CSV file
   * @param {string} outputPath - Path to save Excel file
   * @returns {string} Path to generated Excel file
   */
  async csvToExcel(csvPath, outputPath) {
    return new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(csvPath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', row => data.push(row))
        .on('end', async () => {
          try {
            const excelPath = await this.jsonToExcel(data, 'Sheet1', outputPath);
            resolve(excelPath);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }
}

module.exports = new ExcelService(); 