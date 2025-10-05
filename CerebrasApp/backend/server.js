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
    const result = await sendToCerebras({ prompt: finalPrompt });

    res.json({
      message: 'Cerebras API call successful',
      result
    });
  } catch (err) {
    console.error('Cerebras integration error:', err);
    res.status(500).json({ error: err.message });
  }
});

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

// Start server (this will now work)
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Backend running on http://127.0.0.1:${PORT}`);
});

// Add error logging
server.on('error', (err) => {
  console.error('Server failed to start:', err);
});