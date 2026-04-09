const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    blogId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: 'Blog' },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    excerpt: { type: String },
    content: { type: String, required: true },
    coverImage: { type: String },
    author: { type: String, default: 'VytalYou Team' },
    readTime: { type: Number, default: 5 },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ published: 1, publishedAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
