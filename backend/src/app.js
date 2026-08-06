const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler.middleware');

// Import routes
const v1Routes = require('./routes/v1/index.js');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "*",//allow all origins
  // origin: process.env.FRONTEND_URL || 'http://localhost:3000',

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Serve static files
const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

/**
 * Anything not found on disk is in the bucket.
 *
 * Uploads used to be written here and the whole app links to /uploads/<key>.
 * Redirecting rather than changing those links means every stored row and every
 * page keeps working, and files written before the move — which are still on
 * this disk until the next redeploy — are still served from it.
 */
const { publicUrl, usingSupabase } = require('./utils/storage');
app.get('/uploads/:key', (req, res) => {
  if (!usingSupabase()) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  const url = publicUrl(req.params.key);
  if (!url) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  return res.redirect(302, url);
});

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// API Routes
app.use('/api/v1', v1Routes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

module.exports = app; 