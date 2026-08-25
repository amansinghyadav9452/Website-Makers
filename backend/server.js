require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');

const inquiriesRouter = require('./routes/inquiries');
const analyticsRouter = require('./routes/analytics');
const reviewsRouter = require('./routes/reviews');
const clientsRouter = require('./routes/clients');
const authRouter = require('./routes/auth');
const filesRouter = require('./routes/files');
const paymentsRouter = require('./routes/payments');
const chatbotRouter = require('./routes/chatbot');
const blogRouter = require('./routes/blog');
const newsletterRouter = require('./routes/newsletter');
const appointmentsRouter = require('./routes/appointments');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;

// Trust proxy for rate limiting
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://sitesmaker.online,https://www.sitesmaker.online')
  .split(',').map(v => v.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 600
};

// Security: Helmet with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", ...allowedOrigins],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Additional security headers
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.set('X-DNS-Prefetch-Control', 'off');
  next();
});

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Compression
app.use(compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Logging
app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '20kb', strict: true }));
app.use(mongoSanitize());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api', globalLimiter);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// SSE: Admin real-time notifications
const sseClients = new Map();

app.get('/api/sse', require('./middleware/auth').requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const adminId = req.admin.email || req.admin.adminId;
  sseClients.set(adminId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(adminId);
    logger.info(`SSE client disconnected: ${adminId}`);
  });

  logger.info(`SSE client connected: ${adminId}`);
});

// Broadcast function
function broadcastToAdmins(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res, id) => {
    try {
      res.write(msg);
    } catch (e) {
      logger.error(`SSE broadcast failed for ${id}:`, e.message);
      sseClients.delete(id);
    }
  });
}

// Make broadcast available globally
app.locals.broadcastToAdmins = broadcastToAdmins;

// Health check
app.get('/', (req, res) => res.json({ ok: true, service: 'website-makers-api', status: 'running', version: '2.0.0' }));
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/blog', blogRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/appointments', appointmentsRouter);

// Swagger docs (if configured)
if (process.env.ENABLE_SWAGGER === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerJsdoc = require('swagger-jsdoc');
    const options = {
      definition: {
        openapi: '3.0.0',
        info: { title: 'Website Makers API', version: '2.0.0', description: 'Production API documentation' },
        servers: [{ url: process.env.API_URL || 'https://website-makers-api.onrender.com' }],
      },
      apis: ['./routes/*.js'],
    };
    const specs = swaggerJsdoc(options);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
  } catch (e) {
    logger.warn('Swagger not configured:', e.message);
  }
}

// 404 handler
app.use((req, res) => res.status(404).json({ ok: false, error: 'Route not found.' }));

// Error handler
app.use((err, req, res, next) => {
  logger.error('API error:', err.message, { stack: err.stack, path: req.path, method: req.method });
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ ok: false, error: 'Validation failed.', details: Object.values(err.errors).map(e => e.message) });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ ok: false, error: 'Invalid ID format.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ ok: false, error: 'Duplicate entry found.' });
  }

  res.status(err.status || 500).json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message });
});

// Startup validation
if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not configured.');
  process.exit(1);
}
if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
  logger.error('ADMIN_JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL) {
  logger.error('ADMIN_EMAIL is not configured.');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
  logger.error('Set ADMIN_PASSWORD_HASH (recommended) or ADMIN_PASSWORD.');
  process.exit(1);
}
if (!process.env.CLIENT_JWT_SECRET) {
  logger.warn('CLIENT_JWT_SECRET is not set; client sessions will use ADMIN_JWT_SECRET. Set a separate secret for stronger isolation.');
}

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    mongoose.connection.once('open', () => logger.info('Connected to MongoDB Atlas'));
    app.listen(PORT, () => logger.info(`API running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
