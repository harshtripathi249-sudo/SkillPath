const express = require('express');
const router = express.Router();
const internshipService = require('../services/internshipService');

// GET /api/internships/stats
router.get('/stats', (req, res) => {
  try {
    const stats = internshipService.getInternshipStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve internship stats', details: err.message });
  }
});

// GET /api/internships
router.get('/', (req, res) => {
  try {
    const { search, remoteStatus, compensation, field } = req.query;
    const items = internshipService.getInternships({
      search,
      remoteStatus,
      compensation,
      field
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve internships', details: err.message });
  }
});

// GET /api/internships/:id
router.get('/:id', (req, res) => {
  try {
    const item = internshipService.getInternshipById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Internship listing not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve internship', details: err.message });
  }
});

module.exports = router;
