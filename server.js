require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const inquiriesRouter = require('./routes/inquiries');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Comma-separated list of allowed frontend origins, e.g.
// "https://website-makers.onrender.com,https://www.yourdomain.com"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'website-makers-api', status: 'running' });
});

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.json({ ok: true, db: dbState === 1 ? 'connected' : 'not connected' });
});

app.use('/api/inquiries', inquiriesRouter);

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it in your environment variables (.env locally, or Render dashboard).');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
