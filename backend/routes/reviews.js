const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const data = await Review.find({ approved: true, featured: true })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Reviews fetch error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not load reviews.' });
  }
});

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const data = await Review.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Admin reviews fetch error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not load reviews.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const text = String(req.body?.text || '').trim();
    if (name.length < 2 || text.length < 3) {
      return res.status(400).json({ ok: false, error: 'Name and review text are required (min 2 and 3 chars).' });
    }
    const data = await Review.create({
      name: name.slice(0, 120),
      role: String(req.body?.role || 'Client').slice(0, 120),
      rating: Math.min(5, Math.max(1, Number(req.body?.rating) || 5)),
      text: text.slice(0, 1200),
      featured: req.body?.featured !== false,
      approved: req.body?.approved === true
    });
    res.status(201).json({ ok: true, data });
  } catch (err) {
    console.error('Review create error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not create review.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    for (const key of ['name', 'role', 'text']) {
      if (typeof req.body?.[key] === 'string') {
        update[key] = req.body[key].trim().slice(0, key === 'text' ? 1200 : 120);
      }
    }
    if (req.body?.rating !== undefined) {
      update.rating = Math.min(5, Math.max(1, Number(req.body.rating) || 5));
    }
    if (req.body?.featured !== undefined) update.featured = !!req.body.featured;
    if (req.body?.approved !== undefined) update.approved = !!req.body.approved;

    const data = await Review.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Review update error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not update review.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const data = await Review.findByIdAndDelete(req.params.id).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Review delete error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not delete review.' });
  }
});

module.exports = router;
