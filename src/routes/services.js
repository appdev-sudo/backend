const express = require('express');
const MedicalService = require('../models/MedicalService');

const router = express.Router();

// GET /api/services — all services, optional ?category=iv_drips|diagnostics|red_light|hyperbaric|longevity
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const services = await MedicalService.find(filter).sort({ category: 1, order: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch services.' });
  }
});

// GET /api/services/categories — list of categories with counts
router.get('/categories', async (req, res) => {
  try {
    const counts = await MedicalService.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(counts.map((c) => ({ category: c._id, count: c.count })));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories.' });
  }
});

// GET /api/services/:id — single service by _id or serviceId
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const service = isMongoId
      ? await MedicalService.findById(id)
      : await MedicalService.findOne({ serviceId: id });
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch service.' });
  }
});

module.exports = router;
