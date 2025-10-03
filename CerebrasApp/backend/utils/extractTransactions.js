const csv = require('csv-parser'); // already a dependency
const { Transform } = require('stream');

/**
 * Normalise a raw transaction object.
 * MPESA PDFs do not contain a date in the extracted text → date = null.
 */
function normalizeTransaction(raw) {
  const amount = parseFloat((raw.amount || '').replace(/[^\d\.\-]/g, '')) || 0;

  return {
    date: null, // No date info in MPESA PDF text
    description: raw.description?.trim() || '',
    amount: raw.type === 'PAID OUT' ? -Math.abs(amount) : Math.abs(amount),
    currency: 'KES' // MPESA statements are always Kenyan Shillings
  };
}

/**
 * CSV extraction – uses csv‑parser (already installed)
 */
function extractFromCsv(csvBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }
    });

    stream
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => resolve(results.map(normalizeTransaction)))
      .on('error', reject);

    // Feed the buffer into the stream
    stream.end(csvBuffer);
  });
}

/**
 * PDF extraction – MPESA‑specific logic
 */
function extractFromPdf(pdfText) {
  // ---------- DEBUG ----------
  console.log('🔍 PDF Text Preview (first 500 chars):');
  console.log(pdfText.substring(0, 500));
  console.log('--- End of Preview ---\n');

  // ---------- Locate the detailed‑statement block ----------
  const detailedIdx = pdfText.indexOf('DETAILED STATEMENT');
  if (detailedIdx === -1) {
    console.warn('⚠️  Could not locate "DETAILED STATEMENT" section.');
    return [];
  }

  const afterHeader = pdfText.slice(detailedIdx);
  const lines = afterHeader.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Known transaction types (exact strings as they appear in the PDF)
  const transactionTypes = [
    'Cash Out',
    'Send Money',
    'Transaction Reversal',
    'Pay Bill',
    'B2C Payment',
    'KenyaRecharge',
    'OD Repayment',
    'Customer Merchant Payment'
  ];

  const transactions = [];

  // ---------- Parse each line ----------
  for (const line of lines) {
    // Skip the header line that contains the column titles
    if (line.startsWith('TRANSACTION TYPE')) continue;

    // Find which transaction type this line belongs to
    const type = transactionTypes.find(t => line.startsWith(t));
    if (!type) continue; // not a transaction row

    // Extract the two numeric columns (PAID IN & PAID OUT)
    // Replace everything that is not a digit, dot or comma with a space,
    // then split on whitespace.
    const numbers = line
      .replace(/[^\d.,-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // Expected: [paidIn, paidOut] – sometimes one of them can be "0.00"
    const paidIn  = numbers[0] || '0';
    const paidOut = numbers[1] || '0';

    // Credit (PAID IN) – only if amount > 0
    if (parseFloat(paidIn.replace(/,/g, '')) > 0) {
      transactions.push({
        type: 'PAID IN',
        description: type,
        amount: paidIn
      });
    }

    // Debit (PAID OUT) – only if amount > 0
    if (parseFloat(paidOut.replace(/,/g, '')) > 0) {
      transactions.push({
        type: 'PAID OUT',
        description: type,
        amount: paidOut
      });
    }
  }

  console.log(`✅ Extracted ${transactions.length} transaction(s)`);
  return transactions.map(normalizeTransaction);
}

module.exports = {
  extractFromCsv,
  extractFromPdf
};