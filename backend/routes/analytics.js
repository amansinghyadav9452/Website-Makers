const express = require('express');
const rateLimit = require('express-rate-limit');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const router = express.Router();

const eventLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 60, message: { ok:false, error:'Too many analytics events.' }, standardHeaders:true, legacyHeaders:false });

router.post('/events', eventLimiter, async (req, res) => {
  try {
    const event = String(req.body?.event || '').trim();
    if (!event || !/^[a-zA-Z0-9_.:-]{2,80}$/.test(event)) return res.status(400).json({ ok:false, error:'Invalid event.' });
    const device = ['mobile','tablet','desktop','unknown'].includes(req.body?.device) ? req.body.device : 'unknown';
    await AnalyticsEvent.create({
      event,
      path: String(req.body?.path || '/').slice(0,300),
      referrer: String(req.body?.referrer || '').slice(0,500),
      device,
      browser: String(req.body?.browser || 'unknown').slice(0,80),
      sessionId: String(req.body?.sessionId || '').slice(0,80),
      meta: typeof req.body?.meta === 'object' && req.body.meta ? req.body.meta : {}
    });
    res.status(201).json({ ok:true });
  } catch (err) {
    console.error('Analytics event error:', err.message);
    res.status(500).json({ ok:false, error:'Could not record event.' });
  }
});


function requireAdmin(req,res,next){
  const jwt=require('jsonwebtoken'); const h=req.get('authorization')||''; const token=h.startsWith('Bearer ')?h.slice(7):'';
  if(!process.env.ADMIN_JWT_SECRET||!token)return res.status(401).json({ok:false,error:'Unauthorized.'});
  try{const payload=jwt.verify(token,process.env.ADMIN_JWT_SECRET);if(payload.role!=='admin')throw new Error();req.admin=payload;next();}catch{return res.status(401).json({ok:false,error:'Session expired.'});}
}

router.get('/admin/summary', requireAdmin, async (req,res)=>{
  try{
    const since=new Date(Date.now()-30*24*60*60*1000);
    const [events,uniqueSessions,devices,paths,topEvents,ctas]=await Promise.all([
      AnalyticsEvent.countDocuments({createdAt:{$gte:since}}),
      AnalyticsEvent.distinct('sessionId',{createdAt:{$gte:since}}),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$device',count:{$sum:1}}},{$sort:{count:-1}}]),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$path',count:{$sum:1}}},{$sort:{count:-1}},{$limit:10}]),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since}}},{$group:{_id:'$event',count:{$sum:1}}},{$sort:{count:-1}},{$limit:10}]),
      AnalyticsEvent.aggregate([{$match:{createdAt:{$gte:since},event:'cta_click'}},{$count:'count'}])
    ]);
    res.json({ok:true,data:{last30Days:events,uniqueVisitors:uniqueSessions.filter(Boolean).length,devices,paths,events:topEvents,ctaClicks:ctas[0]?.count||0}});
  }catch{res.status(500).json({ok:false,error:'Could not load analytics.'});}
});

module.exports = router;
