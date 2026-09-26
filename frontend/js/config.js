/**
 * SkillPath Frontend Runtime Config
 *
 * Local dev (served by the Express backend, or `npx serve frontend` alongside it on
 * the same origin): leave this as '' - API calls go to the relative path '/api'.
 *
 * Deployed separately (frontend on Vercel, backend on Render): set this to your
 * deployed backend's base URL, no trailing slash, e.g.:
 *   window.SKILLPATH_API_BASE_URL = 'https://skillpath-backend.onrender.com';
 */
window.SKILLPATH_API_BASE_URL = '';
