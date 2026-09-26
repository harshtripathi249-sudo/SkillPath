require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const courseRoutes = require('./routes/courseRoutes');
const pathRoutes = require('./routes/pathRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const coachRoutes = require('./routes/coachRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS_ORIGIN can be set to the deployed frontend's URL (e.g. your Vercel domain) to
// restrict cross-origin access in production. Left unset, all origins are allowed,
// which is fine for local dev or when the frontend is served from this same server.
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',').map(o => o.trim()) } : {}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets when the frontend folder is present alongside this
// server (e.g. local dev, or a combined deploy). When the backend is deployed on its
// own (e.g. Render, with the frontend deployed separately on Vercel), this folder
// won't exist and the backend simply runs as an API-only service.
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const hasFrontend = fs.existsSync(path.join(FRONTEND_DIR, 'index.html'));
if (hasFrontend) {
  app.use(express.static(FRONTEND_DIR));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SkillPath API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/coach', coachRoutes);

// Single Page Application Fallback for client-side navigation.
// When the frontend isn't deployed alongside this backend (API-only deploy), every
// non-API path just 404s as JSON instead of trying to serve a missing index.html.
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `API route ${req.method} ${req.path} does not exist.`
    });
  }
  if (hasFrontend) {
    return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  }
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'This is the SkillPath API server - the frontend is deployed separately.'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`[SkillPath Server] Running on http://localhost:${PORT}`);
    console.log(`[SkillPath Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
