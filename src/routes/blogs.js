const express = require('express');
const Blog = require('../models/Blog');

const router = express.Router();

// GET /api/blogs — all published blogs, optional ?limit=N
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    const query = Blog.find({ published: true })
      .select('-content')
      .sort({ publishedAt: -1 });

    if (limit) {
      query.limit(parseInt(limit, 10));
    }

    const blogs = await query;
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch blogs.' });
  }
});

// GET /api/blogs/:slug — single blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);
    const blog = isMongoId
      ? await Blog.findById(slug)
      : await Blog.findOne({ slug, published: true });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch blog.' });
  }
});

module.exports = router;
