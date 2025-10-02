const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config: memory storage + validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel' // Legacy Excel CSV
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

// ✅ File upload endpoint with validation
app.post('/api/analyze', upload.single('statement'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, size, mimetype } = req.file;

    // Return success + file info
    res.json({
      message: 'File uploaded successfully',
      filename: originalname,
      size: `${(size / 1024).toFixed(2)} KB`,
      type: mimetype,
      readyForProcessing: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler for multer
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