const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, trim: true, maxlength: 120, default: 'Client' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  text: { type: String, required: true, trim: true, maxlength: 1200 },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for fast queries
reviewSchema.index({ approved: 1, featured: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
