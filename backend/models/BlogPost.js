const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 220 },
  excerpt: { type: String, trim: true, maxlength: 500, default: '' },
  content: { type: String, required: true, maxlength: 50000 },
  coverImage: { type: String, trim: true, maxlength: 500, default: '' },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  published: { type: Boolean, default: false, index: true },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0, min: 0 },
  author: { type: String, trim: true, maxlength: 120, default: 'Website Makers' },
  metaTitle: { type: String, trim: true, maxlength: 200, default: '' },
  metaDescription: { type: String, trim: true, maxlength: 300, default: '' },
}, { timestamps: true });

// Text search index
blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text', tags: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
