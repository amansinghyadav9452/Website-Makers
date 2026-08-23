const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 5000 },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: String, default: 'admin' },
  channel: { type: String, default: 'email' }
}, { _id: false });

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    service: { type: String, trim: true, default: 'Other' },
    message: { type: String, trim: true, maxlength: 3000 },
    source: { type: String, default: 'website-contact-form' },
    status: { type: String, enum: ['new', 'contacted', 'in-progress', 'completed', 'archived'], default: 'new', index: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', index: true },
    adminNotes: { type: String, maxlength: 5000, default: '' },
    lastResponseAt: { type: Date, default: null },
    responses: { type: [responseSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
