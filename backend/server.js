const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseCsv } = require('./utils/parseCsv');
const { extractFromCsv } = require('./utils/extractTransactions');
const { extractFromPdf } = require('./utils/extractTransactions');
const { sendToCerebras } = require('./utils/cerebrasService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF/CSV allowed.`));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('Cerebras Bank-Statement Analyzer Backend');
});

// Dynamic import for pdf-parse (fixes module conflict)
app.post('/api/analyze', upload.single('statement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, size, mimetype, buffer } = req.file;
    let transactions = [];

    if (mimetype === 'application/pdf') {
      // Use fixed parser (no dynamic import needed)
      const { parsePdf } = require('./utils/parsePdf');
      const text = await parsePdf(buffer);
      transactions = extractFromPdf(text);
    } else if (mimetype.includes('csv')) {
      transactions = extractFromCsv(await parseCsv(buffer));
    }

    res.json({
      message: 'File parsed successfully',
      filename: originalname,
      type: mimetype,
      transactions: transactions.slice(0, 5),
      totalTransactions: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: POST /api/cerebras
app.post('/api/cerebras', async (req, res) => {
  console.log('📥 /api/cerebras called with body:', req.body);  // <-- add this line
  try {
    const { transactions, prompt } = req.body;

    let finalPrompt = prompt;

    // If no raw prompt, build one from transactions
    if (!finalPrompt && Array.isArray(transactions) && transactions.length > 0) {
      const promptLines = transactions.map(t => {
        const amount = Number(t.amount).toFixed(2);
        return `${t.description}: ${amount} ${t.currency}`;
      });
      finalPrompt = `Summarize the following MPESA transactions:\n${promptLines.join('\n')}`;
    }

    // If no prompt at all, return an error
    if (!finalPrompt) {
      return res.status(400).json({ error: 'No prompt or transactions provided' });
    }

    // Call Cerebras with the final prompt
    const result = await sendToCerebras({
      prompt: finalPrompt,
      max_tokens: 300,        // 👈 add this line
      temperature: 0.7        // optional
    });

    res.json({
      message: 'Cerebras API call successful',
      result
    });
  } catch (err) {
    console.error('Cerebras integration error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/summarize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { mimetype, buffer, originalname } = req.file;
    let transactions = [];

    // Detect bank type from filename or content
    const bankType = detectBankType(originalname, buffer.toString());

    if (mimetype === 'application/pdf') {
      const { parsePdf } = require('./utils/parsePdf');
      const text = await parsePdf(buffer);
      transactions = extractTransactions(text, bankType);
    } else if (mimetype.includes('csv')) {
      const text = await parseCsv(buffer);
      transactions = extractTransactions(text, bankType);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions found' });
    }

    const prompt = buildPromptFromTransactions(transactions);
    const result = await sendToCerebras({ prompt, max_tokens: 200 });

    res.json({
      message: 'Summary generated successfully',
      bank: bankType,
      transactions,
      summary: result.choices[0].text.trim(),
    });
  } catch (err) {
    console.error('❌ Error in /api/summarize:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// New endpoint: POST /api/insights
app.post('/api/insights', async (req, res) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Invalid transactions array' });
  }

  const prompt = `Categorize and analyze the following MPESA transactions:\n${transactions.map(t =>
    `${t.date || 'N/A'}: ${t.description} ${t.amount > 0 ? '+' : ''}${t.amount} ${t.currency}`
  ).join('\n')}\n\nProvide:
1. Total income
2. Total expenses
3. Net balance
4. Top 3 categories (e.g., Airtime, Send Money, etc.)
5. Any possible fraud flags (e.g., unusually large amounts, duplicate entries)
`;

  try {
    const result = await sendToCerebras({ prompt, max_tokens: 300 });
    res.json({
      message: 'Insights generated',
      insights: result.choices[0].text.trim()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildPromptFromTransactions(transactions) {
  const lines = transactions.map(t => {
    const sign = Number(t.amount) < 0 ? '-' : '+';
    const absAmount = Math.abs(Number(t.amount)).toFixed(2);
    return `${t.description} ${sign}${absAmount} ${t.currency}`;
  });

  return `Summarize the following MPESA transactions:\n${lines.join('\n')}`;
}

// Helper to detect bank
function detectBankType(filename, text) {
  if (filename.toLowerCase().includes('mpesa') || text.includes('MPESA')) {
    return 'mpesa';
  }
  // Add more bank detectors
  return 'generic';
}

// Export the app for testing
module.exports = app;

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '127.0.0.1';

  app.listen(PORT, HOST, () => {
    console.log(`✅ Backend running on http://${HOST}:${PORT}`);
  }).on('error', (err) => {
    console.error('Server failed to start:', err);
  });
}

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 5MB.' });
    }
  }
  console.error(err);
  res.status(500).json({ error: err.message });
});