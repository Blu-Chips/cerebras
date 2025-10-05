function extractTransactions(text, bankType) {
  const lines = text.split('\n');
  const transactions = [];

  let regex;
  switch (bankType) {
    case 'mpesa':
      regex = /(\d{4}-\d{2}-\d{2})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(KES)/g;
      break;
    case 'equity':
      regex = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(KES)/g;
      break;
    case 'kcb':
      regex = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(KES)/g;
      break;
    default:
      regex = /(\d{4}[-\/]\d{2}[-\/]\d{2})\s+(.*?)\s+([+-]?\d+(?:\.\d+)?)\s+(\w{3})/g;
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