# SkillPath Backend

This directory contains the Express.js server, REST API endpoints, domain services, and seed data.

## Directory Structure
- `server.js`: Main Express application entry point, middleware configuration, static file serving (`../frontend`), health checks, and error handlers.
- `routes/`:
  - `courseRoutes.js`: GET `/api/courses`, `/api/courses/stats`, `/api/courses/:id`
  - `pathRoutes.js`: GET `/api/paths`, `/api/paths/:id`, POST `/api/paths/generate`, PATCH `/api/paths/:id/stages/:stageNum/tasks/:taskId`
  - `internshipRoutes.js`: GET `/api/internships`, `/api/internships/:id`
  - `coachRoutes.js`: GET `/api/coach/presets`, POST `/api/coach/ask`
- `services/`:
  - `courseService.js`: Course catalog querying and domain filters.
  - `pathService.js`: Path generation algorithm tailoring roadmaps to learner constraints.
  - `internshipService.js`: Internship exploration and stipend filtering.
  - `coachService.js`: Entity-grounded diagnostic learning coach with specific catalog grounding and honest fallbacks.
- `data/`:
  - `seed.json`: Combined catalog of `courses`, `learningPaths`, and `internships`, loaded by the services above via `fs.readFileSync`.

## Running Backend
```bash
npm run start:backend
# or
node backend/server.js
```
The server runs by default at `http://localhost:3000`.

## Deploying Standalone (e.g. Render)

This backend is self-contained and can be deployed on its own, independent of `frontend/`:
- If `frontend/` isn't present alongside `server.js` at runtime, it automatically skips static file serving and runs as an API-only service (no crash, no missing-file errors).
- Required env var: `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY` / `OPENAI_API_KEY`) to enable the AI-powered Learning Coach; without one it falls back to the rules-based engine.
- Optional: `CORS_ORIGIN` to restrict cross-origin requests to your deployed frontend's URL once you know it (comma-separated for multiple origins). Unset allows all origins.
- See the root [README.md](../README.md#deployment-backend-on-render-frontend-on-vercel) for the full Render + Vercel walkthrough.
