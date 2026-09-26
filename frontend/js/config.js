/**
 * SkillPath Frontend Runtime Config
 *
 * Local dev (served by the Express backend, or `npx serve frontend` alongside it on
 * the same origin): API calls go to the relative path '/api'.
 *
 * Deployed separately (frontend on Vercel, backend on Render): API calls go to the
 * deployed backend's base URL below.
 *
 * Auto-detected by hostname so this file doesn't need to be edited when switching
 * between local dev and the deployed site. Update RENDER_BACKEND_URL if you ever
 * redeploy the backend to a different Render URL.
 */
(function () {
  const RENDER_BACKEND_URL = 'https://skillpath-gi3k.onrender.com';
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  window.SKILLPATH_API_BASE_URL = isLocal ? '' : RENDER_BACKEND_URL;
})();
