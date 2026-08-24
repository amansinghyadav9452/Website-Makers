const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');
const { requireAdmin } = require('../middleware/auth');

function validatePayload(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name is required (min 2 chars)');
  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length < 6) errors.push('phone is required (min 6 chars)');
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (body.message && body.message.length > 3000) errors.push('message is too long (max 3000 chars)');
  return errors;
}

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { ok: false, error: 'Too many admin requests.' },
  standardHeaders: true,
  legacyHeaders: false
});

function verifyAdminPassword(password) {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  // If ADMIN_PASSWORD_HASH is set, verify using scrypt with embedded salt
  if (storedHash) {
    const parts = storedHash.split(':');
    if (parts.length === 2) {
      const [salt, hash] = parts;
      try {
        const test = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(test), Buffer.from(hash));
      } catch {
        return false;
      }
    }
    // Legacy: direct comparison (deprecated, logs warning)
    console.warn('ADMIN_PASSWORD_HASH is not in salt:hash format. Please re-hash using scripts/hash-password.js');
    const inputHash = crypto.scryptSync(password, 'website-makers-salt', 64).toString('hex');
    return inputHash === storedHash;
  }

  // Fallback to plain text comparison (only for development)
  if (plainPassword) {
    console.warn('Using plain ADMIN_PASSWORD. Set ADMIN_PASSWORD_HASH for production.');
    return password === plainPassword;
  }

  return false;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;

function signAdminToken() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { role: 'admin', email: process.env.ADMIN_EMAIL },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

router.post('/admin/login', adminLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    if (email !== (process.env.ADMIN_EMAIL || '').trim().toLowerCase()) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }

    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }

    const token = signAdminToken();
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { status, search, sort = 'createdAt', order = 'desc', page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));
    const sortOrder = order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      Inquiry.find(query).sort({ [sort]: sortOrder }).skip(skip).limit(Math.min(100, parseInt(limit, 10))).lean(),
      Inquiry.countDocuments(query)
    ]);

    res.json({ ok: true, data, total, page: parseInt(page, 10), pages: Math.ceil(total / Math.min(100, parseInt(limit, 10))) });
  } catch (err) {
    console.error('Inquiries fetch error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not load inquiries.' });
  }
});

router.post('/', submitLimiter, async (req, res) => {
  try {
    const errors = validatePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join('; ') });
    }

    const inquiry = await Inquiry.create({
      name: req.body.name.trim().slice(0, 120),
      email: req.body.email.trim().toLowerCase().slice(0, 120),
      phone: req.body.phone.trim().slice(0, 30),
      message: (req.body.message || '').trim().slice(0, 3000),
      source: String(req.body.source || 'website').slice(0, 50),
      status: 'new'
    });

    // Send notification email if SMTP is configured
    if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: (process.env.SMTP_PORT || '587') === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.sendMail({
          from: `"Website Makers" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `New inquiry from ${inquiry.name}`,
          text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nMessage: ${inquiry.message}\nSource: ${inquiry.source}`
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr.message);
      }
    }

    res.status(201).json({ ok: true, data: inquiry });
  } catch (err) {
    console.error('Inquiry submission error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not save inquiry. Please try again later.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body.status && ['new', 'contacted', 'in-progress', 'completed', 'archived'].includes(req.body.status)) {
      update.status = req.body.status;
    }
    if (req.body.priority && ['low', 'normal', 'high', 'urgent'].includes(req.body.priority)) {
      update.priority = req.body.priority;
    }
    if (req.body.notes !== undefined) update.notes = String(req.body.notes).slice(0, 2000);
    if (req.body.quotedPrice !== undefined) update.quotedPrice = Math.max(0, parseFloat(req.body.quotedPrice) || 0);

    const data = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Inquiry update error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not update inquiry.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const data = await Inquiry.findByIdAndDelete(req.params.id).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Inquiry delete error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not delete inquiry.' });
  }
});

module.exports = router;
