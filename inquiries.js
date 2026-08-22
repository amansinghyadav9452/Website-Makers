const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');

function validatePayload(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  if (!body.phone || typeof body.phone !== 'string') errors.push('phone is required');
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) errors.push('valid email is required');
  return errors;
}

router.post('/', async (req, res) => {
  try {
    const errors = validatePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    const inquiry = await Inquiry.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      service: req.body.service,
      message: req.body.message
    });
    res.status(201).json({ ok: true, id: inquiry._id });
  } catch (err) {
    console.error('Failed to save inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/inquiries — for you (admin) to view leads. Protect this before going live (see README).
router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

module.exports = router;
