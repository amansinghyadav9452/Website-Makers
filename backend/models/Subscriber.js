const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  name: { type: String, trim: true, maxlength: 120, default: '' },
  subscribed: { type: Boolean, default: true, index: true },
  source: { type: String, trim: true, maxlength: 120, default: 'website-footer' },
  tags: [{ type: String, trim: true, maxlength: 30 }],
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
