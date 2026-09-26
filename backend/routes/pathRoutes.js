const express = require('express');
const router = express.Router();
const pathService = require('../services/pathService');

// GET /api/paths
router.get('/', (req, res) => {
  try {
    const paths = pathService.getAllPaths();
    res.json({ success: true, count: paths.length, data: paths });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve paths', details: err.message });
  }
});

// POST /api/paths/generate
router.post('/generate', (req, res) => {
  try {
    const { goal, experienceLevel, weeklyHours, budget, credentialNeed, learningStyle } = req.body || {};

    // Validate inputs
    if (!goal && !experienceLevel) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one discovery parameter (goal or experienceLevel) must be provided.'
      });
    }

    const generatedPath = pathService.generatePath({
      goal: goal || 'Data Analysis',
      experienceLevel: experienceLevel || 'beginner',
      weeklyHours: weeklyHours || '8-10',
      budget: budget || 'budget',
      credentialNeed: credentialNeed || 'industry-recognized',
      learningStyle: learningStyle || 'hands-on'
    });

    res.json({
      success: true,
      message: 'Learning path generated successfully',
      data: generatedPath
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate path', details: err.message });
  }
});

// GET /api/paths/:id
router.get('/:id', (req, res) => {
  try {
    const pathItem = pathService.getPathById(req.params.id);
    if (!pathItem) {
      return res.status(404).json({ success: false, error: 'Learning path not found' });
    }
    res.json({ success: true, data: pathItem });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve path', details: err.message });
  }
});

// PATCH /api/paths/:id/stages/:stage/tasks/:taskId
router.patch('/:id/stages/:stage/tasks/:taskId', (req, res) => {
  try {
    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'completed field must be a boolean' });
    }

    const result = pathService.updateTask(req.params.id, req.params.stage, req.params.taskId, completed);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task', details: err.message });
  }
});

// POST /api/paths/:id/stages/:stage/validate
router.post('/:id/stages/:stage/validate', (req, res) => {
  try {
    const result = pathService.validateModule(req.params.id, req.params.stage);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to validate module', details: err.message });
  }
});

module.exports = router;
