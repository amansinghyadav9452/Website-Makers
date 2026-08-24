const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  message: { type: String, trim: true, maxlength: 3000 },
  source: { type: String, trim: true, maxlength: 50, default: 'website' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'completed', 'archived'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: { type: String, trim: true, maxlength: 2000 },
  quotedPrice: { type: Number, min: 0, default: 0 }
}, {
  timestamps: true
});

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ email: 1 });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
