const express = require('express');
const rateLimit = require('express-rate-limit');
const Subscriber = require('../models/Subscriber');
const { requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many subscription attempts.' }
});

// Public: Subscribe
router.post('/subscribe', subscribeLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required.' });
    }

    await Subscriber.create({
      email,
      name: name.slice(0, 120),
      source: String(req.body?.source || 'website').slice(0, 120),
      tags: Array.isArray(req.body?.tags) ? req.body.tags.map(t => String(t).trim().slice(0, 30)) : []
    });

    logger.info(`Newsletter subscription: ${email}`);
    res.json({ ok: true, message: 'Subscribed successfully!' });
  } catch (err) {
    if (err.code === 11000) {
      // Already subscribed - update to active
      await Subscriber.findOneAndUpdate({ email }, { subscribed: true });
      return res.json({ ok: true, message: 'You are already subscribed!' });
    }
    logger.error('Subscribe error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not subscribe.' });
  }
});

// Public: Unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    await Subscriber.findOneAndUpdate({ email }, { subscribed: false });
    res.json({ ok: true, message: 'Unsubscribed successfully.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not unsubscribe.' });
  }
});

// Admin: List subscribers
router.get('/admin/subscribers', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, subscribed = '' } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const filter = {};
    if (subscribed !== '') filter.subscribed = subscribed === 'true';

    const [data, total] = await Promise.all([
      Subscriber.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      Subscriber.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load subscribers.' });
  }
});

// Admin: Export subscribers as CSV
router.get('/admin/export', requireAdmin, async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ subscribed: true }).select('email name createdAt').lean();
    const rows = [['Email', 'Name', 'Subscribed At'], ...subscribers.map(s => [s.email, s.name || '', s.createdAt])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not export subscribers.' });
  }
});

module.exports = router;
