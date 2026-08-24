const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'blocked'], default: 'pending' },
  dueDate: Date,
  completedAt: Date
}, { _id: true });

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120, unique: true },
  passwordHash: { type: String, required: true },
  projectName: { type: String, trim: true, maxlength: 200 },
  status: { type: String, trim: true, maxlength: 50, default: 'onboarding' },
  milestones: [milestoneSchema],
  liveUrl: { type: String, trim: true, maxlength: 500 },
  repoUrl: { type: String, trim: true, maxlength: 500 },
  notes: { type: String, trim: true, maxlength: 2000 }
}, {
  timestamps: true
});

clientSchema.index({ email: 1 });
clientSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Client', clientSchema);
