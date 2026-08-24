const express = require('express');
const rateLimit = require('express-rate-limit');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

const eventLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 40, standardHeaders: 'draft-7', legacyHeaders: false, message: { ok:false, error:'Too many analytics events.' } });

router.post('/events', eventLimiter, async (req, res) => {
  try {
    const event = String(req.body?.event || '').trim();
    if (!/^[a-zA-Z0-9_.:-]{2,80}$/.test(event)) return res.status(400).json({ ok:false, error:'Invalid event.' });
    const device = ['mobile','tablet','desktop','unknown'].includes(req.body?.device) ? req.body.device : 'unknown';
    const meta = (req.body?.meta && typeof req.body.meta === 'object' && !Array.isArray(req.body.meta)) ? req.body.meta : {};
    await AnalyticsEvent.create({
      event,
      path: String(req.body?.path || '/').slice(0,300),
      referrer: String(req.body?.referrer || '').slice(0,500),
      device,
      browser: String(req.body?.browser || 'unknown').slice(0,80),
      sessionId: String(req.body?.sessionId || '').slice(0,80),
      meta
    });
    res.status(201).json({ ok:true });
  } catch (err) {
    console.error('Analytics event error:', err.message);
    res.status(500).json({ ok:false, error:'Could not record event.' });
  }
});

router.get('/admin/summary', requireAdmin, async (req,res) => {
  try {
    const since = new Date(Date.now() - 30*24*60*60*1000);
    const [events, uniqueSessions, devices, paths, topEvents, ctas] = await Promise.all([
      AnalyticsEvent.countDocuments({createdAt:{$gte:since}}),
      AnalyticsEvent.distinct('sessionId',{createdAt:{$gte:since}}),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$device',count:{$sum:1}}},{$sort:{count:-1}}]),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$path',count:{$sum:1}}},{$sort:{count:-1}},{$limit:10}]),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$event',count:{$sum:1}}},{$sort:{count:-1}},{$limit:10}]),
      AnalyticsEvent.countDocuments({createdAt:{$gte:since},event:'cta_click'})
    ]);
    res.json({ok:true,data:{last30Days:events,uniqueVisitors:uniqueSessions.filter(Boolean).length,devices,paths,events:topEvents,ctaClicks:ctas}});
  } catch (err) { res.status(500).json({ok:false,error:'Could not load analytics.'}); }
});
module.exports = router;
