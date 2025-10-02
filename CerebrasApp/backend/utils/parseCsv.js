const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Parse CSV buffer into structured transactions
 * @param {Buffer} buffer - CSV file buffer
 * @returns {Promise<Array>} - Parsed transactions
 */
async function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

module.exports = { parseCsv };