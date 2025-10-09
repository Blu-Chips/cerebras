const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from PDF using temporary file (fixes buffer issues)
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function parsePdf(buffer) {
  try {
    // Create temporary file
    const tempPath = path.join(__dirname, 'temp.pdf');
    fs.writeFileSync(tempPath, buffer);
    
    // Try parsing without password first
    try {
      const data = await pdf(tempPath);
      fs.unlinkSync(tempPath);
      return data.text;
    } catch (error) {
      // Handle password-protected PDFs
      if (error.message.includes('No password given')) {
        fs.unlinkSync(tempPath);
        throw new Error('PDF is password-protected. Please remove password and try again.');
      }
      throw error;
    }
  } catch (error) {
    // Always clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {}
    
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = { parsePdf };