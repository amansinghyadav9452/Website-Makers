const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    service: { type: String, trim: true, default: 'Other' },
    message: { type: String, trim: true, maxlength: 3000 },
    source: { type: String, default: 'website-contact-form' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
