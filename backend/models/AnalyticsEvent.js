const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: { type: String, required: true, trim: true, maxlength: 80 },
  path: { type: String, trim: true, maxlength: 300, default: '/' },
  referrer: { type: String, trim: true, maxlength: 500, default: '' },
  device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
  browser: { type: String, trim: true, maxlength: 80, default: 'unknown' },
  sessionId: { type: String, trim: true, maxlength: 80 },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });

// TTL index: auto-delete events older than 90 days
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AnalyticsEvent', analyticsSchema);
