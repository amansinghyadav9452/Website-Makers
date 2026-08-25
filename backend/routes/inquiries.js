const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const { requireAdmin, signToken, verifyPassword, checkLockout, recordFailedAttempt, clearAttempts } = require('../middleware/auth');
const { sanitizeHtml, sanitizePlainText } = require('../utils/sanitize');
const logger = require('../utils/logger');
const router = express.Router();

const submitLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 8, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { ok: false, error: 'Too many submissions. Please try again later.' } 
});

const loginLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 8, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { ok: false, error: 'Too many login attempts. Please try again later.' } 
});

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
  const expected = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  const actual = Buffer.from(String(password || ''));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

router.post('/admin/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  try {
    checkLockout(email);
  } catch (e) {
    return res.status(423).json({ ok: false, error: e.message });
  }

  if (email !== String(process.env.ADMIN_EMAIL || '').trim().toLowerCase() || !verifyAdminPassword(password)) {
    recordFailedAttempt(email);
    logger.warn(`Failed admin login attempt: ${email}`);
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
  }

  clearAttempts(email);

  try {
    const token = signToken({ role: 'admin', email: process.env.ADMIN_EMAIL }, 'admin', '8h');
    logger.info(`Admin login successful: ${email}`);
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

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `New Website Makers enquiry — ${inquiry.name}`,
      text: `New enquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nService: ${inquiry.service}\n\n${inquiry.message || ''}`
    });
  } catch (err) {
    logger.error('Admin notification email failed:', err.message);
  }
}

router.post('/', submitLimiter, async (req, res) => {
  try {
    // Honeypot check
    if (String(req.body?.website || '').trim()) {
      logger.info(`Honeypot triggered from IP: ${req.ip}`);
      return res.status(201).json({ ok: true });
    }

    const errors = validatePayload(req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const inquiry = await Inquiry.create({
      name: String(req.body.name).trim(),
      phone: String(req.body.phone).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      service: String(req.body.service || 'Other').trim().slice(0, 120),
      message: sanitizePlainText(String(req.body.message || '').trim()).slice(0, 3000),
      source: String(req.body.source || 'website-contact-form').slice(0, 120)
    });

    // Notify admins via SSE if available
    const broadcast = req.app.locals.broadcastToAdmins;
    if (broadcast) {
      broadcast({ type: 'new_inquiry', id: inquiry._id, name: inquiry.name, service: inquiry.service });
    }

    notifyNewInquiry(inquiry).catch(err => logger.error('Admin notification email failed:', err.message));
    logger.info(`New inquiry created: ${inquiry.email}`);

    res.status(201).json({ ok: true, id: inquiry._id });
  } catch (err) {
    logger.error('Failed to save inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { q = '', status = '', priority = '', service = '', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (['new', 'contacted', 'in-progress', 'completed', 'archived'].includes(status)) filter.status = status;
    if (['low', 'normal', 'high', 'urgent'].includes(priority)) filter.priority = priority;
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

    logger.info(`Inquiries fetched by admin: ${req.admin.email}`);
    res.json({
      ok: true,
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
      stats: { total: allCount, new: statMap.new || 0, contacted: statMap.contacted || 0, inProgress: statMap['in-progress'] || 0, completed: statMap.completed || 0 }
    });
  } catch (err) {
    logger.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    }

    const update = {};
    if (['new', 'contacted', 'in-progress', 'completed', 'archived'].includes(req.body?.status)) update.status = req.body.status;
    if (['low', 'normal', 'high', 'urgent'].includes(req.body?.priority)) update.priority = req.body.priority;
    if (typeof req.body?.adminNotes === 'string') update.adminNotes = sanitizePlainText(req.body.adminNotes).slice(0, 5000);

    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });

    logger.info(`Inquiry updated: ${req.params.id} by ${req.admin.email}`);
    res.json({ ok: true, data: inquiry });
  } catch (err) {
    logger.error('Failed to update inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Could not update inquiry.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    }
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });

    logger.info(`Inquiry deleted: ${req.params.id} by ${req.admin.email}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error('Failed to delete inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Could not delete inquiry.' });
  }
});

// Reply to inquiry
router.post('/:id/reply', requireAdmin, async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid inquiry id.' });
    }

    const message = sanitizePlainText(String(req.body?.message || '').trim());
    if (!message || message.length < 2) {
      return res.status(400).json({ ok: false, error: 'Message is required.' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          responses: {
            message,
            sentAt: new Date(),
            sentBy: req.admin.email,
            channel: String(req.body?.channel || 'email')
          }
        },
        lastResponseAt: new Date(),
        status: 'contacted'
      },
      { new: true }
    ).lean();

    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });

    logger.info(`Reply sent to inquiry: ${req.params.id} by ${req.admin.email}`);
    res.json({ ok: true, data: inquiry });
  } catch (err) {
    logger.error('Failed to send reply:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send reply.' });
  }
});

module.exports = router;
module.exports.verifyAdminPassword = verifyAdminPassword;
