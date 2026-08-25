const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clientName: { type: String, required: true, trim: true, maxlength: 120 },
  clientEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
  clientPhone: { type: String, trim: true, maxlength: 20, default: '' },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true, trim: true, maxlength: 10 },
  duration: { type: Number, default: 30, min: 15, max: 240 }, // minutes
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'], 
    default: 'pending',
    index: true 
  },
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
  service: { type: String, trim: true, maxlength: 120, default: 'Consultation' },
  assignedTo: { type: String, trim: true, maxlength: 120, default: '' },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
