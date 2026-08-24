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
const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;

// Render terminates TLS at its proxy. Trust exactly one proxy hop so req.ip is usable for rate limiting.
app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://sitesmaker.online,https://www.sitesmaker.online')
  .split(',').map(v => v.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 600
};

// Helmet defaults are useful; CSP is deliberately not enabled here because the public React page
// uses inline SVG/style attributes and third-party technology logos. Other security headers remain active.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '20kb', strict: true }));
app.use(mongoSanitize());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api', globalLimiter);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.get('/', (req, res) => res.json({ ok: true, service: 'website-makers-api', status: 'running' }));
app.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' });
});

app.use('/api/inquiries', inquiriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/clients', clientsRouter);

app.use((req, res) => res.status(404).json({ ok: false, error: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ ok: false, error: 'Internal server error.' });
});

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not configured.');
  process.exit(1);
}
if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
  console.error('ADMIN_JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL) {
  console.error('ADMIN_EMAIL is not configured.');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
  console.error('Set ADMIN_PASSWORD_HASH (recommended) or ADMIN_PASSWORD.');
  process.exit(1);
}
if (!process.env.CLIENT_JWT_SECRET) console.warn('CLIENT_JWT_SECRET is not set; client sessions will use ADMIN_JWT_SECRET. Set a separate secret for stronger isolation.');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.once('open', () => console.log('Connected to MongoDB Atlas')))
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });
