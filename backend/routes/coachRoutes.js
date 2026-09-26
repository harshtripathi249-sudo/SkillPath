const express = require('express');
const router = express.Router();
const coachService = require('../services/coachService');

// GET /api/coach/presets
router.get('/presets', (req, res) => {
  try {
    res.json({ success: true, data: coachService.PRESETS });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve coach presets', details: err.message });
  }
});

// POST /api/coach/ask
router.post('/ask', async (req, res) => {
  try {
    const { query: rawQuery, message, goal, experienceLevel, weeklyHours, budget, credentialNeed, learningStyle } = req.body || {};
    const query = rawQuery || message;

    const response = await coachService.analyzeInquiry({
      query,
      goal,
      experienceLevel,
      weeklyHours,
      budget,
      credentialNeed,
      learningStyle
    });

    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to process coach inquiry', details: err.message });
  }
});

module.exports = router;
