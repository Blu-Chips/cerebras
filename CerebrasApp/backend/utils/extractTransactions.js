const { parse } = require('csv-parse/sync');

/**
 * Helper – normalize a raw transaction object
 */
function normalizeTransaction(tx) {
  // ---- Date ----
  const isoDate = (() => {
    const m = tx.date?.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (!m) return null;
    // Assume DD/MM/YYYY (common in MPESA statements)
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  })();

  // ---- Amount ----
  const amount = (() => {
    if (!tx.amount) return 0;
    // Remove commas, spaces, currency symbols
    const clean = tx.amount.replace(/[^\d\.\-]/g, '');
    return parseFloat(clean) || 0;
  })();

  return {
    date: isoDate,
    description: (tx.description || tx.desc || '').trim(),
    amount,
    currency: 'KES' // MPESA statements are always KES
  };
}

/**
 * CSV extraction – already works (kept unchanged)
 */
function extractFromCsv(csvData) {
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