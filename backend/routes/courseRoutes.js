const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');

// GET /api/courses/stats
router.get('/stats', (req, res) => {
  try {
    const stats = courseService.getCourseStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve stats', details: err.message });
  }
});

// GET /api/courses
router.get('/', (req, res) => {
  try {
    const { search, subject, level, price, certificateStatus, featured } = req.query;
    const courses = courseService.getCourses({
      search,
      subject,
      level,
      price,
      certificateStatus,
      featured
    });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to search courses', details: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  try {
    const course = courseService.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve course', details: err.message });
  }
});

module.exports = router;
