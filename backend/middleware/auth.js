const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const ADMIN_AUDIENCE = 'website-makers-admin';
const CLIENT_AUDIENCE = 'website-makers-client';

// Account lockout tracking (in-memory; use Redis in production)
const loginAttempts = new Map(); // email -> { count, lockedUntil }

function checkLockout(email) {
  const record = loginAttempts.get(email);
  if (record && record.lockedUntil > Date.now()) {
    const minutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
  }
}

function recordFailedAttempt(email) {
  const record = loginAttempts.get(email) || { count: 0 };
  record.count++;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 min lock
    logger.warn(`Account locked for ${email} due to failed attempts`);
  }
  loginAttempts.set(email, record);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

function passwordHash(password) {
  const value = String(password || '');
  if (value.length < 12) throw new Error('Password must be at least 12 characters.');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(value, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  try {
    const actual = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
    const a = Buffer.from(actual, 'hex');
    const b = Buffer.from(expectedHex, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function getSecret(kind) {
  return kind === 'client'
    ? (process.env.CLIENT_JWT_SECRET || process.env.ADMIN_JWT_SECRET)
    : process.env.ADMIN_JWT_SECRET;
}

function signToken(payload, kind = 'admin', expiresIn = '8h') {
  const secret = getSecret(kind);
  if (!secret || secret.length < 32) throw new Error('JWT secret is not configured securely.');
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
    issuer: 'website-makers-api',
    audience: kind === 'client' ? CLIENT_AUDIENCE : ADMIN_AUDIENCE
  });
}

function verifyToken(token, kind) {
  const secret = getSecret(kind);
  if (!secret || secret.length < 32) throw new Error('JWT secret is not configured securely.');
  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'website-makers-api',
    audience: kind === 'client' ? CLIENT_AUDIENCE : ADMIN_AUDIENCE
  });
}

function bearer(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function requireAdmin(req, res, next) {
  try {
    const payload = verifyToken(bearer(req), 'admin');
    if (payload.role !== 'admin') throw new Error('role');
    req.admin = payload;
    next();
  } catch (err) {
    logger.warn(`Admin auth failed: ${err.message}`);
    res.status(401).json({ ok: false, error: 'Unauthorized or expired session.' });
  }
}

function requireClient(req, res, next) {
  try {
    const payload = verifyToken(bearer(req), 'client');
    if (payload.role !== 'client' || !payload.clientId) throw new Error('role');
    req.client = payload;
    next();
  } catch (err) {
    logger.warn(`Client auth failed: ${err.message}`);
    res.status(401).json({ ok: false, error: 'Unauthorized or expired client session.' });
  }
}

// Permission check middleware
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ ok: false, error: 'Unauthorized.' });
    if (req.admin.type === 'legacy') return next(); // Legacy admin has all permissions
    if (req.admin.permissions && req.admin.permissions.includes(permission)) return next();
    if (req.admin.role === 'superadmin') return next();
    res.status(403).json({ ok: false, error: 'Insufficient permissions.' });
  };
}

module.exports = { 
  passwordHash, 
  verifyPassword, 
  signToken, 
  verifyToken, 
  requireAdmin, 
  requireClient,
  requirePermission,
  checkLockout,
  recordFailedAttempt,
  clearAttempts
};
