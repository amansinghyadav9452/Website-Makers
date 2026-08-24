const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Client = require('../models/Client');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requireAdmin, requireClient } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;

const clientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts. Please try again later.' }
});

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(test), Buffer.from(hash));
}

router.post('/login', clientLoginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });
    }

    const client = await Client.findOne({ email });
    if (!client || !verifyPassword(password, client.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Invalid client credentials.' });
    }

    const token = jwt.sign(
      { role: 'client', clientId: String(client._id), email: client.email },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ ok: true, token, client: { name: client.name, email: client.email } });
  } catch (err) {
    console.error('Client login error:', err.message);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

router.get('/me', requireClient, async (req, res) => {
  try {
    const client = await Client.findById(req.client.clientId).select('-passwordHash').lean();
    if (!client) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true, data: client });
  } catch (err) {
    console.error('Client fetch error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not load client data.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const data = await Client.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Clients list error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not load clients.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (name.length < 2 || !email || password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Name, valid email, and password (min 6 chars) are required.' });
    }

    const existing = await Client.findOne({ email });
    if (existing) return res.status(409).json({ ok: false, error: 'Client with this email already exists.' });

    const data = await Client.create({
      name: name.slice(0, 120),
      email: email.slice(0, 120),
      passwordHash: hashPassword(password),
      projectName: String(req.body?.projectName || '').slice(0, 200),
      status: String(req.body?.status || 'onboarding'),
      milestones: Array.isArray(req.body?.milestones) ? req.body.milestones : []
    });

    const { passwordHash, ...safeData } = data.toObject();
    res.status(201).json({ ok: true, data: safeData });
  } catch (err) {
    console.error('Client create error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not create client.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim().slice(0, 120);
    if (req.body.projectName !== undefined) update.projectName = String(req.body.projectName).slice(0, 200);
    if (req.body.status !== undefined) update.status = String(req.body.status).slice(0, 50);
    if (req.body.milestones !== undefined) update.milestones = Array.isArray(req.body.milestones) ? req.body.milestones : [];
    if (req.body.password) update.passwordHash = hashPassword(req.body.password);

    const data = await Client.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash').lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Client update error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not update client.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const data = await Client.findByIdAndDelete(req.params.id).lean();
    if (!data) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Client delete error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not delete client.' });
  }
});

module.exports = router;
