const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function validatePayload(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name is required');
  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) errors.push('phone is required');
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (body.message && body.message.length > 3000) errors.push('message is too long');
  return errors;
}

const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { ok: false, error: 'Too many submissions. Please try again later.' }, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, message: { ok: false, error: 'Too many admin requests.' }, standardHeaders: true, legacyHeaders: false });

function signAdminToken() {
  return jwt.sign({ role: 'admin', email: process.env.ADMIN_EMAIL }, process.env.ADMIN_JWT_SECRET, { expiresIn: '8h' });
}

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!process.env.ADMIN_JWT_SECRET || !token) return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('invalid role');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Session expired. Please sign in again.' });
  }
}

router.post('/admin/login', adminLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_JWT_SECRET || (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH)) {
    return res.status(503).json({ ok: false, error: 'Admin authentication is not configured on the server.' });
  }
  const passwordOk = process.env.ADMIN_PASSWORD_HASH
    ? (() => {
        const [salt, stored] = String(process.env.ADMIN_PASSWORD_HASH).split(':');
        if (!salt || !stored) return false;
        const derived = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(stored));
      })()
    : password === process.env.ADMIN_PASSWORD;
  if (email !== process.env.ADMIN_EMAIL.toLowerCase() || !passwordOk) {
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
  }
  res.json({ ok: true, token: signAdminToken(), admin: { email: process.env.ADMIN_EMAIL } });
});

router.get('/admin/me', requireAdmin, (req, res) => res.json({ ok: true, admin: { email: req.admin.email } }));


async function notifyNewInquiry(inquiry) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_NOTIFY_EMAIL) return;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject: `New Website Makers enquiry — ${inquiry.name}`,
    text: `New enquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nService: ${inquiry.service}\n\n${inquiry.message || ''}`
  });
}

router.post('/', submitLimiter, async (req, res) => {
  try {
    if (req.body.website) return res.status(201).json({ ok: true });
    const errors = validatePayload(req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });
    const inquiry = await Inquiry.create({
      name: req.body.name.trim(), phone: req.body.phone.trim(), email: req.body.email.trim().toLowerCase(),
      service: String(req.body.service || 'Other').slice(0,120), message: String(req.body.message || '').slice(0,3000),
      source: String(req.body.source || 'website-contact-form').slice(0,120)
    });
    notifyNewInquiry(inquiry).catch(err => console.error('Admin notification email failed:', err.message));
    res.status(201).json({ ok: true, id: inquiry._id });
  } catch (err) {
    console.error('Failed to save inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { q = '', status = '', priority = '', service = '', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (service) filter.service = service;
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }, { service: rx }];
    }
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const [data, total, stats] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      Inquiry.countDocuments(filter),
      Inquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    const statMap = Object.fromEntries(stats.map(s => [s._id, s.count]));
    const allCount = await Inquiry.countDocuments();
    res.json({ ok: true, data, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }, stats: { total: allCount, new: statMap.new || 0, contacted: statMap.contacted || 0, inProgress: statMap['in-progress'] || 0, completed: statMap.completed || 0 } });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (['new', 'contacted', 'in-progress', 'completed', 'archived'].includes(req.body.status)) update.status = req.body.status;
    if (['low', 'normal', 'high', 'urgent'].includes(req.body.priority)) update.priority = req.body.priority;
    if (typeof req.body.adminNotes === 'string') update.adminNotes = req.body.adminNotes.slice(0, 5000);
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true, data: inquiry });
  } catch (err) { res.status(500).json({ ok: false, error: 'Could not update inquiry.' }); }
});

function escapeHtml(value) { return value.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

function mailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || 'false') === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}

router.post('/:id/respond', requireAdmin, async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message || message.length > 5000) return res.status(400).json({ ok: false, error: 'Reply must contain 1–5000 characters.' });
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    const transport = mailTransport();
    if (!transport) return res.status(503).json({ ok: false, error: 'Email sending is not configured. Add SMTP_* environment variables.' });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: inquiry.email,
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
      subject: String(req.body.subject || `Re: Your Website Makers enquiry`).slice(0, 180),
      text: message,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#222"><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><small>Website Makers</small></div>`
    });
    inquiry.responses.push({ message, channel: 'email', sentBy: req.admin.email });
    inquiry.lastResponseAt = new Date();
    if (inquiry.status === 'new') inquiry.status = 'contacted';
    await inquiry.save();
    res.json({ ok: true, data: inquiry });
  } catch (err) {
    console.error('Failed to send reply:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send reply.' });
  }
});


router.get('/admin/customers', requireAdmin, async (req,res) => {
  try {
    const customers = await Inquiry.aggregate([
      {$group:{_id:'$email', name:{$first:'$name'}, email:{$first:'$email'}, phone:{$first:'$phone'}, enquiries:{$sum:1}, latest:{$max:'$createdAt'}, statuses:{$push:'$status'}}},
      {$sort:{latest:-1}}, {$limit:200}
    ]);
    res.json({ok:true,data:customers});
  } catch { res.status(500).json({ok:false,error:'Could not load customers.'}); }
});

router.delete('/:id', requireAdmin, async (req,res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ok:false,error:'Inquiry not found.'});
    res.json({ok:true});
  } catch { res.status(500).json({ok:false,error:'Could not delete inquiry.'}); }
});

module.exports = router;
