const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!JWT_SECRET || !token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('invalid role');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Session expired. Please sign in again.' });
  }
}

function requireClient(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!JWT_SECRET || !token) {
    return res.status(401).json({ ok: false, error: 'Client session expired.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'client') throw new Error('invalid role');
    req.client = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Client session expired.' });
  }
}

module.exports = { requireAdmin, requireClient };
