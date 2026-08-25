const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const PasswordReset = require('../models/PasswordReset');
const Client = require('../models/Client');
const Admin = require('../models/Admin');
const { passwordHash, verifyPassword, signToken, requireAdmin, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

const forgotLimiter = rateLimit({ 
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  standardHeaders: 'draft-7', 
  legacyHeaders: false,
  message: { ok: false, error: 'Too many reset requests. Try again later.' }
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many reset attempts. Try again later.' }
});

function mailTransport() {
  const nodemailer = require('nodemailer');
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

// Client forgot password
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required.' });
    }

    const client = await Client.findOne({ email });
    if (!client) {
      // Don't reveal if email exists
      return res.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Invalidate old tokens
    await PasswordReset.updateMany({ email, used: false }, { used: true });

    const token = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    const transport = mailTransport();
    if (transport) {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://sitesmaker.online'}/reset-password?token=${token}`;
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reset your Website Makers password',
        html: `<p>Hello,</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}" style="padding:12px 24px;background:#00d4aa;color:#000;text-decoration:none;border-radius:6px;">Reset Password</a></p><p>Or copy this link: ${resetUrl}</p><p>This link expires in 1 hour.</p><p>If you didn't request this, ignore this email.</p>`,
        text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`
      });
    }

    logger.info(`Password reset requested for ${email}`);
    res.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('Forgot password error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not process request.' });
  }
});

// Client reset password
router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, error: 'Reset token is required.' });
    }
    if (!password || String(password).length < 12) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 12 characters.' });
    }

    const record = await PasswordReset.findOne({ 
      token, 
      used: false, 
      expiresAt: { $gt: new Date() } 
    });

    if (!record) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired reset token.' });
    }

    await Client.findOneAndUpdate(
      { email: record.email },
      { passwordHash: passwordHash(password) }
    );

    record.used = true;
    await record.save();

    logger.info(`Password reset completed for ${record.email}`);
    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    logger.error('Reset password error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not reset password.' });
  }
});

// Admin login (supports team management)
router.post('/admin/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    // Check legacy single-admin first
    if (email === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()) {
      const { verifyAdminPassword } = require('./inquiries');
      if (verifyAdminPassword(password)) {
        const token = signToken({ role: 'admin', email, type: 'legacy' }, 'admin', '8h');
        return res.json({ ok: true, token, admin: { email, name: 'Admin', role: 'superadmin' } });
      }
    }

    // Check team admin
    const admin = await Admin.findOne({ email, active: true });
    if (admin && verifyPassword(password, admin.passwordHash)) {
      admin.lastLogin = new Date();
      await admin.save();

      const token = signToken({ 
        role: 'admin', 
        email, 
        adminId: String(admin._id),
        type: 'team',
        permissions: admin.permissions 
      }, 'admin', '8h');

      logger.info(`Team admin login: ${email}`);
      return res.json({ 
        ok: true, 
        token, 
        admin: { 
          email, 
          name: admin.name, 
          role: admin.role,
          permissions: admin.permissions 
        } 
      });
    }

    res.status(401).json({ ok: false, error: 'Invalid credentials.' });
  } catch (err) {
    logger.error('Admin login error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not login.' });
  }
});

// Create team admin (superadmin only)
router.post('/admin/team', requireAdmin, async (req, res) => {
  try {
    // Check if requester is superadmin
    const requester = await Admin.findById(req.admin?.adminId);
    if (!requester || requester.role !== 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Superadmin access required.' });
    }

    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = ['superadmin', 'admin', 'editor'].includes(req.body?.role) ? req.body.role : 'editor';
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({ ok: false, error: 'Valid name is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required.' });
    }
    if (password.length < 12) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 12 characters.' });
    }

    const admin = await Admin.create({
      name,
      email,
      passwordHash: passwordHash(password),
      role,
      permissions
    });

    const safe = admin.toObject();
    delete safe.passwordHash;

    logger.info(`New team admin created: ${email} by ${req.admin.email}`);
    res.status(201).json({ ok: true, data: safe });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, error: 'An admin with this email already exists.' });
    }
    logger.error('Create admin error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not create admin.' });
  }
});

// List team admins
router.get('/admin/team', requireAdmin, async (req, res) => {
  try {
    const data = await Admin.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load team.' });
  }
});

// Update team admin
router.patch('/admin/team/:id', requireAdmin, async (req, res) => {
  try {
    const requester = await Admin.findById(req.admin?.adminId);
    if (!requester || requester.role !== 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Superadmin access required.' });
    }

    const update = {};
    if (req.body?.name) update.name = String(req.body.name).trim().slice(0, 120);
    if (req.body?.role && ['superadmin', 'admin', 'editor'].includes(req.body.role)) update.role = req.body.role;
    if (Array.isArray(req.body?.permissions)) update.permissions = req.body.permissions;
    if (req.body?.active !== undefined) update.active = !!req.body.active;
    if (req.body?.password) update.passwordHash = passwordHash(String(req.body.password));

    const admin = await Admin.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash').lean();
    if (!admin) return res.status(404).json({ ok: false, error: 'Admin not found.' });

    logger.info(`Team admin updated: ${admin.email} by ${req.admin.email}`);
    res.json({ ok: true, data: admin });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not update admin.' });
  }
});

module.exports = router;
