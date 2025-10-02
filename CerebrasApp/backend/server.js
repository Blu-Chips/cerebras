import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parsePdf } from './utils/parsePdf.js';
import { parseCsv } from './utils/parseCsv.js';

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

// Updated analysis endpoint
app.post('/api/analyze', upload.single('statement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, size, mimetype, buffer } = req.file;
    let transactions = [];

    if (mimetype === 'application/pdf') {
      const text = await parsePdf(buffer);
      transactions = [{ rawText: text.substring(0, 500) + '...' }];
    } else if (mimetype.includes('csv')) {
      transactions = await parseCsv(buffer);
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

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});