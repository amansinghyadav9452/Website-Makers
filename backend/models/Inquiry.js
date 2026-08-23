const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  channel: { type: String, enum: ['email', 'internal'], default: 'internal' },
  subject: { type: String, trim: true, maxlength: 200 },
  message: { type: String, trim: true, maxlength: 10000 },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: String, trim: true, maxlength: 160 }
}, { _id: false });

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    service: { type: String, trim: true, default: 'Other', maxlength: 120 },
    message: { type: String, trim: true, maxlength: 3000 },
    source: { type: String, default: 'website-contact-form', maxlength: 120 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'in-progress', 'completed', 'archived'],
      default: 'new',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    adminNotes: { type: String, trim: true, maxlength: 5000, default: '' },
    responses: { type: [responseSchema], default: [] }
  },
  { timestamps: true }
);

inquirySchema.index({ email: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
