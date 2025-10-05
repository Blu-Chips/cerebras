function extractTransactions(text, bankType) {
  const lines = text.split('\n');
  const transactions = [];

  let regex;
  if (bankType === 'mpesa') {
    regex = /(\d{4}-\d{2}-\d{2})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(KES)/g;
  } else {
    // Add more bank formats here
    regex = /(\d{4}-\d{2}-\d{2})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(\w{3})/g; // Generic
  }

  let match;
  while ((match = regex.exec(text)) !== null) {
    transactions.push({
      date: match[1],
      description: match[2].trim(),
      amount: parseFloat(match[3]),
      currency: match[4]
    });
  }

  return transactions;
}

module.exports = { extractTransactions };