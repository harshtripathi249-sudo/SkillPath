# SkillPath Frontend

This directory contains all client-side code and static assets for the SkillPath learning prototype.

## Directory Structure
- `index.html`: Main Single Page Application shell featuring Kinetic Horizon design, Stitch questionnaire flows, interactive course carousel, dynamic learning roadmaps, interactive sandbox, and AI Learning Coach modal.
- `css/`:
  - `design-system.css`: Full Kinetic Horizon CSS design system tokens (colors, typography, elevation, glassmorphism, responsive grid layout, zero-layout-shift animations).
- `js/`:
  - `config.js`: Runtime config - sets the backend API base URL. Empty by default (same-origin `/api`, for local dev). Set to your deployed backend's URL when deploying separately (e.g. to Vercel with the backend on Render).
  - `api.js`: Client API service communicating with the SkillPath backend REST endpoints, using the base URL from `config.js`.
  - `app.js`: Main frontend application controller managing state, view routing, questionnaires, milestone progress tracking, and interactive coach.
- `assets/`:
  - `courses/`: High-resolution 16:9 artwork for courses, certificates, and learning tracks.

## Running Frontend
The frontend is served directly by the Express backend (`http://localhost:3000`).
Alternatively, it can be served standalone via any static file server:
```bash
npx serve frontend -p 3000
```

## Deploying Standalone (e.g. Vercel)

This frontend is plain static HTML/CSS/JS - no build step required.
1. In Vercel, set the project's Root Directory to `frontend`.
2. Edit `js/config.js` and set `window.SKILLPATH_API_BASE_URL` to your deployed backend's URL (e.g. your Render service), then commit and redeploy.
3. See the root [README.md](../README.md#deployment-backend-on-render-frontend-on-vercel) for the full Render + Vercel walkthrough.
