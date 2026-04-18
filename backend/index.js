// Load environment variables FIRST — before any other imports
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const scoreRouter = require('./routes/score');
const reportRouter = require('./routes/report');

const app = express();

// Trust Cloud Run's reverse proxy — required for correct IP detection and
// express-rate-limit to work properly behind Google's load balancer.
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://neighbourscore-492917.web.app',
    'https://neighbourscore-492917.firebaseapp.com'
  ]
}));
app.use(express.json());

// Rate limiter — 20 requests per IP per minute on /api/score.
// Localhost is exempt so that the dev server and test suite are not throttled.
// validate:false disables the X-Forwarded-For warning (handled by trust proxy above).
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
  validate: { xForwardedForHeader: false },
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
