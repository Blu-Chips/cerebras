const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// 1️⃣  Middleware
app.use(cors());                 // Enable CORS for frontend requests
app.use(express.json());         // Parse JSON bodies
app.use(express.static('public')); // Serve static files (if needed)

// 2️⃣  File upload setup (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and CSV allowed.'));
    }
  }
});

// 3️⃣  Routes
app.get('/', (req, res) => {
  res.send('Cerebras Bank-Statement Analyzer Backend');
});

// Stub for analysis endpoint
app.post('/api/analyze', upload.single('statement'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Placeholder response
  res.json({
    message: 'File received. Processing will be implemented in Task 2.x',
    filename: req.file.originalname,
    size: req.file.size
  });
});

// 4️⃣  Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// 5️⃣  Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});