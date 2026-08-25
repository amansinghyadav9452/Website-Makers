const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'editor'], 
    default: 'admin',
    index: true 
  },
  permissions: [{ 
    type: String, 
    enum: ['inquiries', 'clients', 'reviews', 'analytics', 'blog', 'newsletter', 'team', 'settings'] 
  }],
  active: { type: Boolean, default: true, index: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
