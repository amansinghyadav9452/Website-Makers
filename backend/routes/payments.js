const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { requireClient, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

let razorpay = null;
try {
  const Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (e) {
  logger.warn('Razorpay not configured:', e.message);
}

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many order requests.' }
});

// Create Razorpay order
router.post('/create-order', orderLimiter, requireClient, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ ok: false, error: 'Payment gateway not configured.' });
    }

    const amount = Number(req.body?.amount);
    const currency = String(req.body?.currency || 'INR').toUpperCase();
    const receipt = String(req.body?.receipt || `rcpt_${Date.now()}`).slice(0, 40);
    const notes = req.body?.notes && typeof req.body.notes === 'object' ? req.body.notes : {};

    if (!amount || amount < 100) {
      return res.status(400).json({ ok: false, error: 'Amount must be at least ₹1.00 (100 paise).' });
    }
    if (amount > 5000000) {
      return res.status(400).json({ ok: false, error: 'Amount exceeds maximum limit.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: {
        clientId: req.client.clientId,
        clientEmail: req.client.email,
        ...notes
      }
    });

    logger.info(`Order created: ${order.id} for client ${req.client.clientId}`);
    res.json({ ok: true, order });
  } catch (err) {
    logger.error('Create order error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not create order.' });
  }
});

// Verify payment
router.post('/verify', requireClient, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: 'Missing payment verification data.' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      logger.warn(`Invalid payment signature from client ${req.client.clientId}`);
      return res.status(400).json({ ok: false, error: 'Invalid payment signature.' });
    }

    // Save payment record (optional - create Payment model if needed)
    logger.info(`Payment verified: ${razorpay_payment_id} for client ${req.client.clientId}`);
    res.json({ ok: true, message: 'Payment verified successfully.', paymentId: razorpay_payment_id });
  } catch (err) {
    logger.error('Payment verify error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not verify payment.' });
  }
});

// Get payment config (public key for frontend)
router.get('/config', (req, res) => {
  res.json({
    ok: true,
    keyId: process.env.RAZORPAY_KEY_ID || '',
    enabled: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
  });
});

module.exports = router;
