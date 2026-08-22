const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Inquiry = require('../models/Inquiry');

// Very small helper to avoid pulling in a validation library for one form.
function validatePayload(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name is required');
  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) errors.push('phone is required');
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (body.message && body.message.length > 3000) errors.push('message is too long');
  return errors;
}

// Tighter limit on submissions specifically, to stop form spam/flooding
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Simple shared-secret check for the admin-only leads endpoint.
// Set ADMIN_API_KEY in your environment and send it as the x-api-key header.
function requireAdminKey(req, res, next) {
  const key = req.get('x-api-key');
  if (!process.env.ADMIN_API_KEY) {
    return res.status(503).json({ ok: false, error: 'Admin access is not configured on this server.' });
  }
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }
  next();
}

// POST /api/inquiries — called by the website's contact form
router.post('/', submitLimiter, async (req, res) => {
  try {
    // Honeypot: real visitors never see or fill this field. If it has a value, it's a bot.
    if (req.body.website) {
      return res.status(201).json({ ok: true }); // pretend success, don't tip off the bot
    }
    const errors = validatePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    const inquiry = await Inquiry.create({
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
      email: req.body.email.trim().toLowerCase(),
      service: req.body.service,
      message: req.body.message
    });
    res.status(201).json({ ok: true, id: inquiry._id });
  } catch (err) {
    console.error('Failed to save inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/inquiries — admin-only view of leads. Requires x-api-key header (see requireAdminKey above).
router.get('/', requireAdminKey, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

module.exports = router;
