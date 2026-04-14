// Load environment variables FIRST — before any other imports
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const scoreRouter = require('./routes/score');
const reportRouter = require('./routes/report');

const app = express();

// Middleware
// TODO: restrict origin to Firebase Hosting domain after deployment
app.use(cors());
app.use(express.json());

// Rate limiter — 20 requests per IP per minute on /api/score.
// Localhost is exempt so that the dev server and test suite are not throttled.
const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skip: (req) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || ''
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  },
  message: { error: 'Too many requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Score API (rate limited)
app.use('/api/score', scoreLimiter, scoreRouter);

// Report API
app.use('/api/report', reportRouter);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NeighbourScore backend running on port ${PORT}`);
});
