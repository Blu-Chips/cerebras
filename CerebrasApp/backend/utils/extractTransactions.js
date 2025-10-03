// ...existing imports and normalizeTransaction function...

/**
 * PDF extraction – MPESA‑specific logic (now captures the description column)
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
  const lines = afterHeader.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

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
    // 1️⃣ Extract the two numeric values (PAID IN & PAID OUT)
    //    The PDF concatenates them, e.g. "0.0025,304.00"
    // -------------------------------------------------
    const numberMatches = line.match(/-?[\d,]+\.\d+/g) || [];

    // Guard against malformed rows
    if (numberMatches.length === 0) continue;

    const paidInRaw  = numberMatches[0] || '0';
    const paidOutRaw = numberMatches[1] || '0';

    const paidIn  = parseFloat(paidInRaw.replace(/,/g, '')) || 0;
    const paidOut = parseFloat(paidOutRaw.replace(/,/g, '')) || 0;

    // -------------------------------------------------
    // 2️⃣ Extract the description (the “details” column)
    //    Remove the transaction type and the two numbers from the line.
    //    Whatever remains (trimmed) is the description.
    // -------------------------------------------------
    // Remove the type prefix
    let descriptionPart = line.slice(type.length).trim();

    // Remove the two numeric strings we just captured
    // (use replace with the exact matched strings to avoid accidental removal)
    descriptionPart = descriptionPart
      .replace(paidInRaw, '')
      .replace(paidOutRaw, '')
      .trim();

    // If the description ends up empty (some rows have no extra details),
    // fall back to the transaction type itself.
    const description = descriptionPart || type;

    // -------------------------------------------------
    // 3️⃣ Create separate transaction objects for credit & debit
    // -------------------------------------------------
    if (paidIn > 0) {
      transactions.push({
        type: 'PAID IN',
        description,
        amount: paidIn
      });
    }

    if (paidOut > 0) {
      transactions.push({
        type: 'PAID OUT',
        description,
        amount: paidOut
      });
    }
  }

  console.log(`✅ Extracted ${transactions.length} transaction(s)`);
  return transactions.map(normalizeTransaction);
}

// ...existing module.exports...
module.exports = {
  extractFromCsv,
  extractFromPdf
};