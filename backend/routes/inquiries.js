const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const { requireAdmin, signJwt, verifyPassword, safeEqualText } = require('../middleware/auth');

const router = express.Router();

function validatePayload(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name is required');
  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) errors.push('phone is required');
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (body.message && String(body.message).length > 3000) errors.push('message is too long');
  return errors;
}

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { ok: false, error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

function getAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || '';
}

function verifyAdminCredentials(email, password) {
  const configuredEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!configuredEmail || !password) return false;
  if (!safeEqualText(String(email || '').trim().toLowerCase(), configuredEmail)) return false;
  if (getAdminPasswordHash()) return verifyPassword(password, getAdminPasswordHash());
  return safeEqualText(password, getAdminPassword());
}

async function sendReplyEmail({ to, subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return { sent: false, reason: 'SMTP not configured' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: message
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email provider error: ${response.status} ${text.slice(0, 300)}`);
  }

  return { sent: true };
}

router.post('/admin/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!process.env.ADMIN_EMAIL || (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) || !process.env.ADMIN_JWT_SECRET) {
    return res.status(503).json({ ok: false, error: 'Admin authentication is not configured.' });
  }

  if (!verifyAdminCredentials(email, password)) {
    return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
  }

  const token = signJwt(
    { role: 'admin', email },
    process.env.ADMIN_JWT_SECRET,
    8 * 60 * 60
  );

  res.json({ ok: true, token, expiresIn: 8 * 60 * 60 });
});

router.get('/admin/customers', requireAdmin, async (req, res) => {
  try {
    const data = await Inquiry.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$email',
          name: { $first: '$name' },
          phone: { $first: '$phone' },
          enquiries: { $sum: 1 },
          lastContact: { $max: '$createdAt' }
        }
      },
      { $sort: { lastContact: -1 } },
      { $limit: 500 }
    ]);
    res.json({ ok: true, data });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not load customers.' });
  }
});

router.post('/', submitLimiter, async (req, res) => {
  try {
    if (req.body?.website) return res.status(201).json({ ok: true });
    const errors = validatePayload(req.body || {});
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const inquiry = await Inquiry.create({
      name: req.body.name.trim(),
      phone: req.body.phone.trim(),
      email: req.body.email.trim().toLowerCase(),
      service: String(req.body.service || 'Other').trim().slice(0, 120),
      message: String(req.body.message || '').trim(),
      source: String(req.body.source || 'website-contact-form').slice(0, 120)
    });

    res.status(201).json({ ok: true, id: inquiry._id });
  } catch (err) {
    console.error('Failed to save inquiry:', err.message);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const query = String(req.query.q || '').trim().slice(0, 120);
    const status = String(req.query.status || '').trim();
    const priority = String(req.query.priority || '').trim();

    const filter = {};
    if (['new', 'contacted', 'in-progress', 'completed', 'archived'].includes(status)) filter.status = status;
    if (['low', 'normal', 'high', 'urgent'].includes(priority)) filter.priority = priority;

    if (query) {
      const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
        { service: { $regex: safe, $options: 'i' } }
      ];
    }

    const [data, total, newCount, contacted, inProgress, completed] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ status: 'contacted' }),
      Inquiry.countDocuments({ status: 'in-progress' }),
      Inquiry.countDocuments({ status: 'completed' })
    ]);

    res.json({
      ok: true,
      count: data.length,
      data,
      stats: {
        total,
        new: newCount,
        contacted,
        inProgress,
        completed
      }
    });
  } catch (err) {
    console.error('Failed to fetch inquiries:', err.message);
    res.status(500).json({ ok: false, error: 'Could not fetch inquiries.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (typeof req.body?.status === 'string' && ['new','contacted','in-progress','completed','archived'].includes(req.body.status)) {
      update.status = req.body.status;
    }
    if (typeof req.body?.priority === 'string' && ['low','normal','high','urgent'].includes(req.body.priority)) {
      update.priority = req.body.priority;
    }
    if (typeof req.body?.adminNotes === 'string') update.adminNotes = req.body.adminNotes.slice(0, 5000);

    const data = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true, data });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not update inquiry.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const data = await Inquiry.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not delete inquiry.' });
  }
});

router.post('/:id/respond', requireAdmin, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });

    const subject = String(req.body?.subject || 'Re: Your Website Makers enquiry').trim().slice(0, 200);
    const message = String(req.body?.message || '').trim().slice(0, 10000);
    if (!message) return res.status(400).json({ ok: false, error: 'Reply message is required.' });

    let channel = 'internal';
    try {
      const result = await sendReplyEmail({ to: inquiry.email, subject, message });
      if (result.sent) channel = 'email';
    } catch (emailError) {
      console.error('Reply email failed:', emailError.message);
      return res.status(502).json({ ok: false, error: 'Email could not be sent. Check mail configuration.' });
    }

    inquiry.responses.push({
      channel,
      subject,
      message,
      sentAt: new Date(),
      sentBy: req.admin.email
    });
    if (inquiry.status === 'new') inquiry.status = 'contacted';
    await inquiry.save();

    res.json({ ok: true, data: inquiry.toObject() });
  } catch (err) {
    console.error('Failed to send reply:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send reply.' });
  }
});

module.exports = router;
