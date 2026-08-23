const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload, secret, expiresInSeconds = 8 * 60 * 60) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  }));
  const data = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyJwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET;
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!secret || !token) return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  try {
    const payload = verifyJwt(token, secret);
    if (payload.role !== 'admin') throw new Error('role');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Session expired.' });
  }
}

function safeEqualText(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = String(stored).split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  const test = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return safeEqualText(test, hash);
}

module.exports = { signJwt, verifyJwt, requireAdmin, hashPassword, verifyPassword, safeEqualText };
