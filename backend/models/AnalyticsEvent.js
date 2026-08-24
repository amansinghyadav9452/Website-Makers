const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  event: { type: String, required: true, trim: true, maxlength: 80, index: true },
  path: { type: String, trim: true, maxlength: 300, default: '/' },
  referrer: { type: String, trim: true, maxlength: 500, default: '' },
  device: { type: String, enum: ['mobile','tablet','desktop','unknown'], default: 'unknown' },
  browser: { type: String, trim: true, maxlength: 80, default: 'unknown' },
  sessionId: { type: String, trim: true, maxlength: 80, index: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
