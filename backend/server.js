require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const inquiriesRouter = require('./routes/inquiries');
const analyticsRouter = require('./routes/analytics');
const reviewsRouter = require('./routes/reviews');
const clientsRouter = require('./routes/clients');

const app = express();

// Render runs behind a reverse proxy. Trust the first proxy hop so rate limiting sees the real client IP.
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Security headers
app.use(helmet());
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser/server-to-server requests and wildcard mode.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  credentials: false
};

// Must run before the API routes so browser preflight requests are handled.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '20kb' }));
app.use(mongoSanitize()); // strip $ / . operators from user input to prevent NoSQL injection

// Global rate limit — protects every route from abuse/scraping
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests. Please slow down.' }
  })
);

// Health checks
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'website-makers-api', status: 'running', version: '1.1.0' });
});

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: true,
    db: dbState === 1 ? 'connected' : 'not connected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/clients', clientsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    ok: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
  });
});

if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set. Add it in your environment variables (.env locally, or Render dashboard).');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('FATAL: MongoDB connection error:', err.message);
    process.exit(1);
  });
