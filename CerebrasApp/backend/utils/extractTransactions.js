const csv = require('csv-parser'); // already a dependency
const { Transform } = require('stream');

/**
 * Normalise a raw transaction object.
 * MPESA PDFs do not contain a date in the extracted text → date = null.
 */
function normalizeTransaction(raw) {
  // ----- Amount handling -------------------------------------------------
  // raw.amount may be a string (CSV) or a number (PDF parser)
  let amount;
  if (typeof raw.amount === 'string') {
    // Strip any non‑numeric characters (commas, currency symbols, etc.)
    amount = parseFloat(raw.amount.replace(/[^\d\.\-]/g, '')) || 0;
  } else {
    // Already a number (from PDF parser)
    amount = Number(raw.amount) || 0;
  }

  // ----- Sign handling --------------------------------------------------
  // raw.type is set to either "PAID IN" or "PAID OUT" by the PDF parser
  const signedAmount = raw.type === 'PAID OUT' ? -Math.abs(amount) : Math.abs(amount);

  // ----- Return normalised object ---------------------------------------
  return {
    date: null, // No date info in MPESA PDF text
    description: raw.description?.trim() || '',
    amount: signedAmount,
    currencyconst csv = require('csv-parser'); // already a dependency
const { Transform } = require('stream');

/**
 * Normalise a raw transaction object.
 * MPESA PDFs do not contain a date in the extracted text → date = null.
 */
function normalizeTransaction(raw) {
  // ----- Amount handling -------------------------------------------------
  // raw.amount may be a string (CSV) or a number (PDF parser)
  let amount;
  if (typeof raw.amount === 'string') {
    // Strip any non‑numeric characters (commas, currency symbols, etc.)
    amount = parseFloat(raw.amount.replace(/[^\d\.\-]/g, '')) || 0;
  } else {
    // Already a number (from PDF parser)
    amount = Number(raw.amount) || 0;
  }

  // ----- Sign handling --------------------------------------------------
  // raw.type is set to either "PAID IN" or "PAID OUT" by the PDF parser
  const signedAmount = raw.type === 'PAID OUT' ? -Math.abs(amount) : Math.abs(amount);

  // ----- Return normalised object ---------------------------------------
  return {
    date: null, // No date info in MPESA PDF text
    description: raw.description?.trim() || '',
    amount: signedAmount,
    currency
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

    // Identify the transaction type at the start of the line
    const type = transactionTypes.find(t => line.startsWith(t));
    if (!type) continue; // not a transaction row

    // -------------------------------------------------
    // 1️⃣ Insert a space between the two numeric groups.
    //    The PDF concatenates them, e.g. "0.0025,304.00".
    //    We split where a digit is followed by another digit
    //    that is preceded by a comma (the start of the second amount).
    // -------------------------------------------------
    const spaced = line.replace(
      /(\d[\d.,]*)\s*(\d[\d.,]*)$/g, // captures two groups at line end
      '$1 $2'
    );

    // 2️⃣ Remove everything that is not a digit, dot, comma or minus,
    //    then split on whitespace.
    const parts = spaced
      .replace(/[^\d.,-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // After the cleanup we expect:
    //   parts[0] = PAID IN  (may be "0" or "0.00")
    //   parts[1] = PAID OUT (may be "0" or "0.00")
    const paidInRaw  = parts[0] || '0';
    const paidOutRaw = parts[1] || '0';

    const paidIn  = parseFloat(paidInRaw.replace(/,/g, '')) || 0;
    const paidOut = parseFloat(paidOutRaw.replace(/,/g, '')) || 0;

    // -------------------------------------------------
    // 3️⃣ Create separate transaction objects.
    // -------------------------------------------------
    if (paidIn > 0) {
      transactions.push({
        type: 'PAID IN',
        description: type,
        amount: paidIn
      });
    }

    if (paidOut > 0) {
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