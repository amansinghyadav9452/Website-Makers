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
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(helmet());
app.disable('x-powered-by');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-api-key'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '20kb' }));
app.use(mongoSanitize());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/', (req,res) => res.json({ok:true,service:'website-makers-api',status:'running'}));
app.get('/health', (req,res) => {
  const dbState = mongoose.connection.readyState;
  res.json({ok:true,db:dbState===1?'connected':'not connected'});
});

app.use('/api/inquiries', inquiriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/clients', clientsRouter);

app.use((err, req, res, next) => {
  if (err?.message?.startsWith('CORS blocked origin:')) {
    return res.status(403).json({ ok:false, error:'Origin not allowed.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ok:false,error:'Internal server error.'});
});

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}
if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
  console.error('ADMIN_JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL || (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH)) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD or ADMIN_PASSWORD_HASH are required.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
