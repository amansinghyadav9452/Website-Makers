const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ADMIN_AUDIENCE = 'website-makers-admin';
const CLIENT_AUDIENCE = 'website-makers-client';

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
  } catch {
    res.status(401).json({ ok: false, error: 'Unauthorized or expired session.' });
  }
}

function requireClient(req, res, next) {
  try {
    const payload = verifyToken(bearer(req), 'client');
    if (payload.role !== 'client' || !payload.clientId) throw new Error('role');
    req.client = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Unauthorized or expired client session.' });
  }
}

module.exports = { passwordHash, verifyPassword, signToken, verifyToken, requireAdmin, requireClient };
