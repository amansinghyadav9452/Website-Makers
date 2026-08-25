const express = require('express');
const rateLimit = require('express-rate-limit');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

const eventLimiter = rateLimit({ 
  windowMs: 5 * 60 * 1000, 
  max: 40, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { ok: false, error: 'Too many analytics events.' } 
});

const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many batch requests.' }
});

// Single event
router.post('/events', eventLimiter, async (req, res) => {
  try {
    const event = String(req.body?.event || '').trim();
    if (!/^[a-zA-Z0-9_.:-]{2,80}$/.test(event)) return res.status(400).json({ ok: false, error: 'Invalid event.' });
    const device = ['mobile', 'tablet', 'desktop', 'unknown'].includes(req.body?.device) ? req.body.device : 'unknown';
    const meta = (req.body?.meta && typeof req.body.meta === 'object' && !Array.isArray(req.body.meta)) ? req.body.meta : {};

    await AnalyticsEvent.create({
      event,
      path: String(req.body?.path || '/').slice(0, 300),
      referrer: String(req.body?.referrer || '').slice(0, 500),
      device,
      browser: String(req.body?.browser || 'unknown').slice(0, 80),
      sessionId: String(req.body?.sessionId || '').slice(0, 80),
      meta
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not record event.' });
  }
});

// Batch events
router.post('/events/batch', batchLimiter, async (req, res) => {
  try {
    const { events, sessionId, device, browser } = req.body;
    if (!Array.isArray(events) || !events.length) {
      return res.status(400).json({ ok: false, error: 'Events array is required.' });
    }
    if (events.length > 50) {
      return res.status(400).json({ ok: false, error: 'Max 50 events per batch.' });
    }

    const docs = events
      .filter(e => /^[a-zA-Z0-9_.:-]{2,80}$/.test(String(e.event || '').trim()))
      .map(e => ({
        event: String(e.event).trim(),
        path: String(e.path || '/').slice(0, 300),
        referrer: String(e.referrer || '').slice(0, 500),
        device: ['mobile', 'tablet', 'desktop', 'unknown'].includes(e.device) ? e.device : (device || 'unknown'),
        browser: String(browser || 'unknown').slice(0, 80),
        sessionId: String(sessionId || '').slice(0, 80),
        meta: (e.meta && typeof e.meta === 'object' && !Array.isArray(e.meta)) ? e.meta : {},
        createdAt: e.ts ? new Date(e.ts) : new Date()
      }));

    if (docs.length) {
      await AnalyticsEvent.insertMany(docs, { ordered: false });
    }

    res.status(201).json({ ok: true, recorded: docs.length });
  } catch (err) {
    console.error('Analytics batch error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not record events.' });
  }
});

// Admin summary
router.get('/admin/summary', requireAdmin, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [events, uniqueSessions, devices, paths, topEvents, ctas] = await Promise.all([
      AnalyticsEvent.countDocuments({ createdAt: { $gte: since } }),
      AnalyticsEvent.distinct('sessionId', { createdAt: { $gte: since } }),
      AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$device', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$path', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$event', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AnalyticsEvent.countDocuments({ createdAt: { $gte: since }, event: 'cta_click' })
    ]);

    // Daily stats for charts
    const daily = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, unique: { $addToSet: '$sessionId' } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, uniqueVisitors: { $size: '$unique' }, _id: 0 } }
    ]);

    res.json({
      ok: true,
      data: {
        last30Days: events,
        uniqueVisitors: uniqueSessions.filter(Boolean).length,
        devices,
        paths,
        events: topEvents,
        ctaClicks: ctas,
        daily
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load analytics.' });
  }
});

module.exports = router;
