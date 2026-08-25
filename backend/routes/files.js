const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { upload, optimizeImage, getFileExtension } = require('../middleware/upload');
const { requireClient, requireAdmin } = require('../middleware/auth');
const Client = require('../models/Client');
const logger = require('../utils/logger');
const router = express.Router();

// Client file upload
router.post('/upload', requireClient, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded.' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    let buffer = req.file.buffer;
    let ext = getFileExtension(req.file.mimetype);

    if (isImage) {
      buffer = await optimizeImage(buffer, { width: 1600, height: 1600, quality: 85, format: 'webp' });
      ext = 'webp';
    }

    // For now, save to local storage. In production, upload to S3.
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'clients', req.client.clientId);
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const fileUrl = `/uploads/clients/${req.client.clientId}/${filename}`;

    await Client.findByIdAndUpdate(req.client.clientId, {
      $push: { 
        files: { 
          name: req.file.originalname, 
          url: fileUrl, 
          size: buffer.length, 
          type: req.file.mimetype,
          uploadedAt: new Date() 
        } 
      }
    });

    logger.info(`File uploaded by client ${req.client.clientId}: ${req.file.originalname}`);
    res.json({ ok: true, url: fileUrl, name: req.file.originalname, size: buffer.length });
  } catch (err) {
    logger.error('File upload error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not upload file.' });
  }
});

// Client list their files
router.get('/my-files', requireClient, async (req, res) => {
  try {
    const client = await Client.findById(req.client.clientId).select('files').lean();
    res.json({ ok: true, data: client?.files || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load files.' });
  }
});

// Admin upload (for blog covers, etc.)
router.post('/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded.' });

    const isImage = req.file.mimetype.startsWith('image/');
    let buffer = req.file.buffer;
    let ext = getFileExtension(req.file.mimetype);

    if (isImage) {
      buffer = await optimizeImage(buffer, { width: 2000, height: 1200, quality: 90, format: 'webp' });
      ext = 'webp';
    }

    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'admin');
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const fileUrl = `/uploads/admin/${filename}`;

    logger.info(`Admin file uploaded by ${req.admin.email}: ${req.file.originalname}`);
    res.json({ ok: true, url: fileUrl });
  } catch (err) {
    logger.error('Admin upload error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not upload file.' });
  }
});

module.exports = router;
