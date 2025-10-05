function extractFromPdf(text) {
  const lines = text.split('\n');
  const transactions = [];

  // Updated regex to capture date
  const transactionRegex = /(\d{4}-\d{2}-\d{2})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(KES)/g;
  let match;

  while ((match = transactionRegex.exec(text)) !== null) {
    transactions.push({
      date: match[1],
      description: match[2].trim(),
      amount: parseFloat(match[3]),
      currency: match[4]
    });
  }

  return transactions;
}