const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const BlogPost = require('../models/BlogPost');
const { sanitizeHtml } = require('../utils/sanitize');
const logger = require('../utils/logger');
const router = express.Router();

// Public: List published posts
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));

    const filter = { published: true };
    if (tag) filter.tags = String(tag).toLowerCase();
    if (search) {
      filter.$text = { $search: String(search).slice(0, 100) };
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .select('-content')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      BlogPost.countDocuments(filter)
    ]);

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json({
      ok: true,
      data: posts,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load posts.' });
  }
});

// Public: Get single post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!post) return res.status(404).json({ ok: false, error: 'Post not found.' });
    res.json({ ok: true, data: post });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load post.' });
  }
});

// Public: Get tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.distinct('tags', { published: true });
    res.json({ ok: true, data: tags.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load tags.' });
  }
});

// Admin: List all posts
router.get('/admin/posts', requireAdmin, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: posts });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load posts.' });
  }
});

// Admin: Create post
router.post('/admin/posts', requireAdmin, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const slug = String(req.body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const content = sanitizeHtml(req.body?.content);

    if (!title || title.length < 3 || title.length > 200) {
      return res.status(400).json({ ok: false, error: 'Title must be 3-200 characters.' });
    }
    if (!slug || slug.length < 3) {
      return res.status(400).json({ ok: false, error: 'Valid slug is required.' });
    }
    if (!content || content.length < 10) {
      return res.status(400).json({ ok: false, error: 'Content is required.' });
    }

    const post = await BlogPost.create({
      title,
      slug,
      excerpt: String(req.body?.excerpt || '').trim().slice(0, 500),
      content,
      coverImage: String(req.body?.coverImage || '').trim().slice(0, 500),
      tags: Array.isArray(req.body?.tags) ? req.body.tags.map(t => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean) : [],
      published: req.body?.published === true,
      featured: req.body?.featured === true,
      author: String(req.body?.author || 'Sites Maker').trim().slice(0, 120),
      metaTitle: String(req.body?.metaTitle || '').trim().slice(0, 200),
      metaDescription: String(req.body?.metaDescription || '').trim().slice(0, 300),
    });

    logger.info(`Blog post created: ${slug} by ${req.admin.email}`);
    res.status(201).json({ ok: true, data: post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, error: 'A post with this slug already exists.' });
    }
    logger.error('Create blog post error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not create post.' });
  }
});

// Admin: Update post
router.patch('/admin/posts/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body?.title) update.title = String(req.body.title).trim().slice(0, 200);
    if (req.body?.slug) update.slug = String(req.body.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (req.body?.content !== undefined) update.content = sanitizeHtml(req.body.content);
    if (req.body?.excerpt !== undefined) update.excerpt = String(req.body.excerpt).trim().slice(0, 500);
    if (req.body?.coverImage !== undefined) update.coverImage = String(req.body.coverImage).trim().slice(0, 500);
    if (Array.isArray(req.body?.tags)) update.tags = req.body.tags.map(t => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean);
    if (req.body?.published !== undefined) update.published = !!req.body.published;
    if (req.body?.featured !== undefined) update.featured = !!req.body.featured;
    if (req.body?.author) update.author = String(req.body.author).trim().slice(0, 120);
    if (req.body?.metaTitle !== undefined) update.metaTitle = String(req.body.metaTitle).trim().slice(0, 200);
    if (req.body?.metaDescription !== undefined) update.metaDescription = String(req.body.metaDescription).trim().slice(0, 300);

    const post = await BlogPost.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!post) return res.status(404).json({ ok: false, error: 'Post not found.' });

    logger.info(`Blog post updated: ${post.slug} by ${req.admin.email}`);
    res.json({ ok: true, data: post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, error: 'A post with this slug already exists.' });
    }
    res.status(500).json({ ok: false, error: 'Could not update post.' });
  }
});

// Admin: Delete post
router.delete('/admin/posts/:id', requireAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ ok: false, error: 'Post not found.' });
    logger.info(`Blog post deleted: ${post.slug} by ${req.admin.email}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not delete post.' });
  }
});

module.exports = router;
