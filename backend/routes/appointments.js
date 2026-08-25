const express = require('express');
const rateLimit = require('express-rate-limit');
const Appointment = require('../models/Appointment');
const { requireAdmin, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

const bookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many booking attempts.' }
});

// Public: Create appointment (no auth required)
router.post('/book', bookLimiter, async (req, res) => {
  try {
    const clientName = String(req.body?.clientName || '').trim();
    const clientEmail = String(req.body?.clientEmail || '').trim().toLowerCase();
    const clientPhone = String(req.body?.clientPhone || '').trim();
    const date = new Date(req.body?.date);
    const time = String(req.body?.time || '').trim();
    const service = String(req.body?.service || 'Consultation').trim();
    const notes = String(req.body?.notes || '').trim();
    const duration = Number(req.body?.duration) || 30;

    if (!clientName || clientName.length < 2) {
      return res.status(400).json({ ok: false, error: 'Name is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required.' });
    }
    if (isNaN(date.getTime()) || date < new Date()) {
      return res.status(400).json({ ok: false, error: 'Valid future date is required.' });
    }
    if (!time) {
      return res.status(400).json({ ok: false, error: 'Time is required.' });
    }

    // Check for conflicts
    const existing = await Appointment.findOne({
      date: { $gte: new Date(date.setHours(0,0,0,0)), $lt: new Date(date.setHours(23,59,59,999)) },
      time,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    if (existing) {
      return res.status(409).json({ ok: false, error: 'This time slot is already booked. Please choose another.' });
    }

    const appointment = await Appointment.create({
      clientName,
      clientEmail,
      clientPhone,
      date,
      time,
      duration,
      service: service.slice(0, 120),
      notes: notes.slice(0, 2000)
    });

    logger.info(`Appointment booked: ${clientEmail} on ${date.toDateString()} at ${time}`);
    res.status(201).json({ ok: true, data: appointment, message: 'Appointment booked successfully!' });
  } catch (err) {
    logger.error('Book appointment error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not book appointment.' });
  }
});

// Public: Get available slots for a date
router.get('/slots', async (req, res) => {
  try {
    const date = new Date(req.query?.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ ok: false, error: 'Valid date is required.' });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      date: { $gte: start, $lt: end },
      status: { $nin: ['cancelled', 'no-show'] }
    }).select('time').lean();

    const bookedTimes = booked.map(b => b.time);
    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    const available = allSlots.filter(t => !bookedTimes.includes(t));

    res.json({ ok: true, data: available, date: date.toISOString().split('T')[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load slots.' });
  }
});

// Admin: List appointments
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { status = '', date, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const filter = {};

    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }

    const [data, total] = await Promise.all([
      Appointment.find(filter).sort({ date: -1, time: 1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load appointments.' });
  }
});

// Admin: Update appointment
router.patch('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body?.status && ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].includes(req.body.status)) {
      update.status = req.body.status;
    }
    if (req.body?.assignedTo) update.assignedTo = String(req.body.assignedTo).trim().slice(0, 120);
    if (req.body?.notes !== undefined) update.notes = String(req.body.notes).trim().slice(0, 2000);

    const appt = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!appt) return res.status(404).json({ ok: false, error: 'Appointment not found.' });

    logger.info(`Appointment updated: ${appt._id} by ${req.admin.email}`);
    res.json({ ok: true, data: appt });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not update appointment.' });
  }
});

// Admin: Delete appointment
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndDelete(req.params.id);
    if (!appt) return res.status(404).json({ ok: false, error: 'Appointment not found.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not delete appointment.' });
  }
});

module.exports = router;
