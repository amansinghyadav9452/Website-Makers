const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, trim: true, maxlength: 120, default: 'Client' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  text: { type: String, required: true, trim: true, maxlength: 1200 },
  featured: { type: Boolean, default: true },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
