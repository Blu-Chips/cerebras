const csv = require('csv-parser'); // already a dependency
const { Transform } = require('stream');

/**
 * Normalise a raw transaction object.
 * MPESA PDFs usually do not contain a date in the extracted text,
 * so we set `date` to null.
 */
function normalizeTransaction(raw) {
  const amount = parseFloat(
    (raw.amount || '').replace(/[^\d\.\-]/g, '') // strip commas, spaces, currency symbols
  );

  return {
    date: null, // No date information in the raw PDF text
    description: raw.description?.trim() || '',
    amount: raw.type === 'PAID OUT' ? -Math.abs(amount) : Math.abs(amount),
    currencyconst csv = require('csv-parser'); // already a dependency
const { Transform } = require('stream');

/**
 * Normalise a raw transaction object.
 * MPESA PDFs usually do not contain a date in the extracted text,
 * so we set `date` to null.
 */
function normalizeTransaction(raw) {
  const amount = parseFloat(
    (raw.amount || '').replace(/[^\d\.\-]/g, '') // strip commas, spaces, currency symbols
  );

  return {
    date: null, // No date information in the raw PDF text
    description: raw.description?.trim() || '',
    amount: raw.type === 'PAID OUT' ? -Math.abs(amount) : Math.abs(amount),
    currency
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records.map(normalizeTransaction);
}

/**
 * PDF extraction – MPESA‑specific patterns + fallback scanner
 */
function extractFromPdf(pdfText) {
  // ---------- DEBUG: show a preview of the raw text ----------
  console.log('🔍 PDF Text Preview (first 500 chars):');
  console.log(pdfText.substring(0, 500));
  console.log('--- End of Preview ---\n');

  const transactions = [];

  // ---------- MPESA‑specific regex patterns ----------
  const patterns = [
    // Pattern A: Date   Description   Amount
    // Example: 01/08/2025  AIRTIME 2547XXXXXX109  -50.00
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+([A-Za-z0-9\s]+?)\s+([-\d,]+\.\d{2})/g,

    // Pattern B: Date   TransactionID   Description   Amount
    // Example: 01/08/2025  TXN123456789  AIRTIME  -50.00
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+([A-Z0-9]{9,})\s+([A-Za-z0-9\s]+?)\s+([-\d,]+\.\d{2})/g,

    // Pattern C: Date   Description   Amount   KES
    // Example: 01/08/2025  PAYMENT FROM JOHN  1,500.00  KES
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+([A-Za-z0-9\s]+?)\s+([-\d,]+\.\d{2})\s+KES/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      // Determine which groups we have based on pattern length
      let date, description, amount;
      if (match.length === 4) {
        // Pattern A or C (no transaction ID)
        [, date, description, amount] = match;
      } else if (match.length === 5) {
        // Pattern B (has transaction ID)
        [, date, /* txnId */ , description, amount] = match;
      }

      transactions.push({
        date,
        description: description.trim(),
        amount
      });
    }
  }

  // ---------- Fallback: line‑by‑line scanner ----------
  if (transactions.length === 0) {
    const lines = pdfText.split('\n');
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
      const amountMatch = line.match(/([-\d,]+\.\d{2})/);
      if (dateMatch && amountMatch) {
        const date = dateMatch[1];
        const amount = amountMatch[1];
        // Description is everything between date and amount
        const descStart = line.indexOf(date) + date.length;
        const descEnd = line.lastIndexOf(amount);
        const description = line.substring(descStart, descEnd).trim();
        transactions.push({ date, description, amount });
      }
    }
  }

  // ---------- Normalization ----------
  const normalized = transactions.map(normalizeTransaction);
  console.log(`✅ Extracted ${normalized.length} transaction(s)`);
  return normalized;
}

module.exports = {
  extractFromCsv,
  extractFromPdf
};