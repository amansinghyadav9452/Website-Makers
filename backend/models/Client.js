const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  status: { type: String, enum: ['discovery','design','development','testing','live','paused','completed'], default: 'discovery' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  liveUrl: { type: String, trim: true, maxlength: 500, default: '' },
  milestones: [{ label: String, done: Boolean }],
  updatedAt: { type: Date, default: Date.now }
}, {_id:true});
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  passwordHash: { type: String, required: true },
  projects: { type: [projectSchema], default: [] }
}, { timestamps:true });
module.exports = mongoose.model('Client', clientSchema);
