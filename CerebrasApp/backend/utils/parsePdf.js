const pdf = require('pdf-parse');

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function parsePdf(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text; // Plain text content
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

module.exports = { parsePdf };