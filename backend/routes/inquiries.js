const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const { requireAdmin, signToken, verifyPassword } = require('../middleware/auth');

const router = express.Router();
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { ok: false, error: 'Too many submissions. Please try again later.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { ok: false, error: 'Too many login attempts. Please try again later.' } });

function validatePayload(body) {
  const errors = [];
  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const email = String(body?.email || '').trim();
  const message = String(body?.message || '');
  if (name.length < 2 || name.length > 120) errors.push('name is required');
  if (!/^[+()\d\s.-]{6,20}$/.test(phone)) errors.push('valid phone is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) errors.push('valid email is required');
  if (message.length > 3000) errors.push('message is too long');
  return errors;
}

function verifyAdminPassword(password) {
  if (process.env.ADMIN_PASSWORD_HASH) return verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  // Backward-compatible migration path. Prefer ADMIN_PASSWORD_HASH in production.
  const expected = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  const actual = Buffer.from(String(password || ''));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

router.post('/admin/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== String(process.env.ADMIN_EMAIL || '').trim().toLowerCase() || !verifyAdminPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
  }
  try {
    const token = signToken({ role: 'admin', email: process.env.ADMIN_EMAIL }, 'admin', '8h');
    res.json({ ok: true, token, admin: { email: process.env.ADMIN_EMAIL } });
  } catch {
    res.status(503).json({ ok: false, error: 'Admin authentication is not configured securely.' });
  }
});

router.get('/admin/me', requireAdmin, (req, res) => res.json({ ok: true, admin: { email: req.admin.email } }));

function mailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

async function notifyNewInquiry(inquiry) {
  if (!process.env.ADMIN_NOTIFY_EMAIL) return;
  const transport = mailTransport();
  if (!transport) return;
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject: `New Sites Maker enquiry — ${inquiry.name}`,
    text: `New enquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nService: ${inquiry.service}\n\n${inquiry.message || ''}`
  });
}

router.post('/', submitLimiter, async (req, res) => {
  try {
    if (String(req.body?.website || '').trim()) return res.status(201).json({ ok: true });
    const errors = validatePayload(req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });
    const inquiry = await Inquiry.create({
      name: String(req.body.name).trim(),
      phone: String(req.body.phone).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      service: String(req.body.service || 'Other').trim().slice(0, 120),
      message: String(req.body.message || '').trim().slice(0, 3000),
      source: String(req.body.source || 'website-contact-form').slice(0, 120)
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
    if (['new','contacted','in-progress','completed','archived'].includes(status)) filter.status = status;
    if (['low','normal','high','urgent'].includes(priority)) filter.priority = priority;
    if (service) filter.service = String(service).slice(0, 120);
    if (q) {
      const escaped = String(q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { message: rx }, { service: rx }];
    }
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const [data, total, stats, allCount] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      Inquiry.countDocuments(filter),
      Inquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Inquiry.countDocuments()
    ]);
    const statMap = Object.fromEntries(stats.map(s => [s._id, s.count]));
    res.json({ ok: true, data, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }, stats: { total: allCount, new: statMap.new || 0, contacted: statMap.contacted || 0, inProgress: statMap['in-progress'] || 0, completed: statMap.completed || 0 } });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    const update = {};
    if (['new','contacted','in-progress','completed','archived'].includes(req.body?.status)) update.status = req.body.status;
    if (['low','normal','high','urgent'].includes(req.body?.priority)) update.priority = req.body.priority;
    if (typeof req.body?.adminNotes === 'string') update.adminNotes = req.body.adminNotes.slice(0, 5000);
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true, data: inquiry });
  } catch { res.status(500).json({ ok: false, error: 'Could not update inquiry.' }); }
});

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

router.post('/:id/respond', requireAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    const message = String(req.body?.message || '').trim();
    const subject = String(req.body?.subject || 'Re: Your Sites Maker enquiry').trim().slice(0, 180);
    if (!message || message.length > 5000) return res.status(400).json({ ok: false, error: 'Reply must contain 1–5000 characters.' });
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    const transport = mailTransport();
    if (!transport) return res.status(503).json({ ok: false, error: 'Email sending is not configured.' });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: inquiry.email,
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
      subject,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#222"><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><small>Sites Maker</small></div>`
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

router.get('/admin/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await Inquiry.aggregate([
      { $group: { _id: '$email', name: { $first: '$name' }, email: { $first: '$email' }, phone: { $first: '$phone' }, enquiries: { $sum: 1 }, latest: { $max: '$createdAt' }, statuses: { $push: '$status' } } },
      { $sort: { latest: -1 } }, { $limit: 200 }
    ]);
    res.json({ ok: true, data: customers });
  } catch { res.status(500).json({ ok: false, error: 'Could not load customers.' }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true });
  } catch { res.status(500).json({ ok: false, error: 'Could not delete inquiry.' }); }
});

module.exports = router;
