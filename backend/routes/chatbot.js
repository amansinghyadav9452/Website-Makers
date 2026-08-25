const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const router = express.Router();

let openai = null;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  logger.warn('OpenAI not configured:', e.message);
}

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many messages. Please slow down.' }
});

const SYSTEM_PROMPT = `You are the friendly and professional AI assistant for Website Makers, a web development studio in India.

Your role:
- Help visitors understand our services (web design, e-commerce, web apps, SEO)
- Answer pricing questions (mention we offer custom quotes based on requirements)
- Showcase our portfolio and expertise
- Guide users to book a consultation or submit an inquiry
- Collect their email/phone for follow-up when appropriate

Guidelines:
- Be concise (max 3-4 sentences per response)
- Use friendly, professional tone
- If asked about specific pricing, say "Every project is unique. Share your requirements for a custom quote."
- If user wants to talk to a human, say "I'll connect you with our team. Please leave your email and we'll reach out within 24 hours."
- Never make up specific prices
- Always respond in the same language the user is using (English or Hindi)`;

router.post('/chat', chatLimiter, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        ok: false, 
        error: 'AI assistant is temporarily unavailable. Please contact us directly.',
        fallback: true 
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length > 20) {
      return res.status(400).json({ ok: false, error: 'Invalid message history.' });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ ok: false, error: 'Invalid message format.' });
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10) // Keep last 10 messages for context
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    logger.info(`Chatbot response generated. Tokens used: ${completion.usage?.total_tokens || 0}`);

    res.json({ ok: true, reply });
  } catch (err) {
    logger.error('Chatbot error:', err.message);
    res.status(500).json({ 
      ok: false, 
      error: 'AI assistant is temporarily unavailable.',
      fallback: true 
    });
  }
});

// Lead capture from chat
router.post('/capture-lead', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Name and valid email are required.' });
    }

    // Save as inquiry
    const Inquiry = require('../models/Inquiry');
    await Inquiry.create({
      name,
      email,
      phone: phone || 'N/A',
      service: 'Chatbot Lead',
      message: message || 'Lead captured from chatbot',
      source: 'chatbot-lead-capture'
    });

    logger.info(`Chatbot lead captured: ${email}`);
    res.json({ ok: true, message: 'We will contact you soon!' });
  } catch (err) {
    logger.error('Lead capture error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not save your details.' });
  }
});

module.exports = router;
