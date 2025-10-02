/**
 * Normalize transaction data from various bank statement formats
 * @param {Object} transaction - Raw transaction object
 * @returns {Object} - Standardized transaction
 */
function normalizeTransaction(transaction) {
  // Handle different date formats
  const date = parseDate(
    transaction.Date || 
    transaction['Transaction Date'] || 
    transaction['Posting Date']
  );
  
  // Handle different description fields
  const description = 
    transaction.Description || 
    transaction.Merchant || 
    transaction.Narrative;
  
  // Handle different amount formats
  const amount = parseAmount(
    transaction.Amount || 
    transaction['Transaction Amount'] || 
    transaction.Value
  );

  return {
    date,
    description,
    amount,
    currency: 'USD' // Will be detected later
  };
}

/**
 * Parse date string into ISO format (YYYY-MM-DD)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle MM/DD/YYYY
  const mdy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) {
    const month = mdy[1].padStart(2, '0');
    const day = mdy[2].padStart(2, '0');
    const year = mdy[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle DD/MM/YYYY
  const dmy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

/**
 * Parse amount string into number
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  
  // Remove non-numeric except decimal and minus
  let clean = amountStr.replace(/[^\d\.\-]/g, '');
  
  // Handle cases like "1,000.00"
  clean = clean.replace(/,/g, '');
  
  return parseFloat(clean) || 0;
}

/**
 * Extract transactions from CSV data
 */
function extractFromCsv(csvData) {
  return csvData
    .filter(tx => tx.Date || tx['Transaction Date'])
    .map(normalizeTransaction);
}

/**
 * Extract transactions from PDF text using regex
 */
function extractFromPdf(pdfText) {
  // DEBUG: Show first 500 chars of extracted PDF
  console.log('🔍 PDF Text Preview:');
  console.log(pdfText.substring(0, 500));
  console.log('--- End of Preview ---');

  const transactions = [];
  
  // Common bank statement patterns
  const patterns = [
    // Pattern 1: Date | Description | Amount
    /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9 ]+)\s+([-\d.,]+)/g,
    
    // Pattern 2: Date,Description,Amount (CSV-like in PDF)
    /(\d{2}\/\d{2}\/\d{4}),([A-Za-z0-9 ]+),([-\d.,]+)/g,
    
    // Pattern 3: Date Description Amount (space-delimited)
    /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+)\s+([-\d.,]+)/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      transactions.push({
        date: match[1],
        description: match[2].trim(),
        amount: match[3]
      });
    }
  }
  
  return transactions.map(normalizeTransaction);
}

/**
 * Extract transactions from MPESA PDF statements
 */
function extractFromPdf(pdfText) {
  const transactions = [];
  
  // MPESA-specific patterns (tested with common formats)
  const patterns = [
    // Pattern 1: Standard MPESA format (Date | Description | Amount)
    /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+?)\s+([-\d,]+\.\d{2})/g,
    
    // Pattern 2: With transaction ID (common in statements)
    /(\d{2}\/\d{2}\/\d{4}).*?(\d{10}).*?([^\d]+?)\s+([-\d,]+\.\d{2})/g,
    
    // Pattern 3: Compact format (Date Description Amount)
    /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9 ]+)\s+([-\d,]+\.\d{2})/g,
    
    // Pattern 4: With currency code (KES)
    /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+?)\s+([-\d,]+\.\d{2})\s+KES/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      // Pattern 2 has extra groups
      const date = match[1];
      const description = pattern === patterns[1] ? match[3] : match[2];
      const amount = pattern === patterns[1] ? match[4] : match[3];
      
      transactions.push({
        date,
        description: description.trim(),
        amount: amount.replace(/,/g, '')
      });
    }
  }

  // Fallback: Line-by-line scanning for transactions
  if (transactions.length === 0) {
    const lines = pdfText.split('\n');
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      const amountMatch = line.match(/([-\d,]+\.\d{2})/);
      
      if (dateMatch && amountMatch) {
        const date = dateMatch[1];
        const amount = amountMatch[1].replace(/,/g, '');
        const descStart = line.indexOf(date) + date.length;
        const descEnd = line.indexOf(amount);
        const description = line.substring(descStart, descEnd).trim();
        
        transactions.push({ date, description, amount });
      }
    }
  }

  return transactions.map(normalizeTransaction);
}

module.exports = {
  extractFromCsv,
  extractFromPdf
};