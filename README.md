# SkillPath – Guided Learning & Certification Planner

**SkillPath** is an interactive, responsive web application that turns career and study goals into practical, budget-optimized learning paths. It features verified free/low-cost courses, transparent credential metrics, interactive practice arenas, an auto-scrolling course showcase, an internships directory, a learning coach, distinct path generation, and persistent Light/Dark themes.

Built strictly adhering to the **Kinetic Horizon** design system and the Stitch product specifications.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Light & Dark Mode](#light--dark-mode)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [Running Configured Checks](#running-configured-checks)
9. [Course Showcase (Layout & Motion Reference)](#course-showcase-layout--motion-reference)
10. [Internships Directory](#internships-directory)
11. [Interactive Learning Coach](#interactive-learning-coach)
12. [Distinct Learning Path Generation](#distinct-learning-path-generation)
13. [User Accounts & Personalization (Firebase)](#user-accounts--personalization-firebase)
14. [Firebase Setup (Login, Streaks & Per-User Data)](#firebase-setup-login-streaks--per-user-data)
15. [Database & Seed Data Model](#database--seed-data-model)
16. [API Route Reference](#api-route-reference)
17. [Verification Registry (Courses & Internships)](#verification-registry-courses--internships)
18. [Deployment: Backend on Render, Frontend on Vercel](#deployment-backend-on-render-frontend-on-vercel)

---

## Core Features

- **Auto-Scrolling Featured Course Showcase**: Prominent hero banner featuring 7 top-tier free/audit courses from Harvard, Google, freeCodeCamp, Univ. of Michigan, The Odin Project, CalArts, and FSI. Includes pause on hover, pause on focus, pause when tab is inactive, keyboard navigation (Left/Right arrows), slide indicators, and verified provider links.
- **Light and Dark Mode**: Seamless toggle button with high-contrast accessibility (AAA compliance) in both modes, smooth CSS transitions, and preference persistence via `localStorage`.
- **Internships Directory**: Searchable and filterable section for remote/in-person and paid/unpaid opportunities from reputable open-source foundations (Outreachy, Google Summer of Code, Linux Foundation, MLH Fellowship, UN Volunteers) alongside clearly labeled sample opportunities.
- **Interactive Learning Coach**: Rules-based diagnostic wizard that conducts a multi-step interview (goal, experience, hours, budget, credential desire) to clarify ambiguous goals, explain recommendation rationales, provide lower-cost alternatives, and link directly to real courses and internships.
- **Personalized Distinct Path Generation**: Generates customized curriculums that dynamically alter weekly milestones, duration, and resource tiers based on user constraints (Python, Full-Stack Web, Data Analysis, UI/UX, Digital Marketing, Languages, Cloud).
- **Practice Arena & Interactive Sandbox**: In-browser simulated terminal environment validating code snippets and exercises for hands-on learning.

---

## Architecture & Technology Stack

The project is cleanly divided into separate **`frontend/`** and **`backend/`** directory structures:

- **Frontend (`frontend/`)**:
  - Semantic HTML5 (`frontend/index.html`) & Vanilla JavaScript ES6+ modules (`frontend/js/api.js`, `frontend/js/app.js`).
  - Strict **Kinetic Horizon** design system implementation (`frontend/css/design-system.css`) using custom design tokens, CSS variables, Plus Jakarta Sans typography, and fluid responsive grid layouts.
  - High-resolution course assets and badges (`frontend/assets/courses/`).
  - Zero heavy frontend dependencies (no bloated frameworks), ensuring sub-second load times and 100% maintainability.
- **Backend (`backend/`)**:
  - Node.js & Express REST API (`backend/server.js`) with CORS, JSON body parsing, environment configuration, and centralized error handling.
  - Modular service layer:
    - `backend/services/courseService.js`: Search, filtering, and course verification metadata.
    - `backend/services/internshipService.js`: Internship search and multi-facet filtering.
    - `backend/services/coachService.js`: Diagnostic decision tree and entity-grounded recommendation engine.
    - `backend/services/pathService.js`: Adaptive curriculum generator with milestone tasks and alternatives.
  - Curated, editable seed data (`backend/data/seed.json`, `backend/data/courses.json`, etc.) with strict schema validation and explicit verification tracking (`isVerified`, `lastVerified`, `source`).

---

## Light & Dark Mode

SkillPath includes a fully integrated Light and Dark theme system:
- **Toggle Control**: Located in the top-right navigation bar (`#themeToggleBtn`).
- **Persistence**: Remembers user choice across page reloads via `localStorage.getItem('skillpath_theme')`.
- **System Default**: Automatically falls back to the user's OS preference (`prefers-color-scheme: dark`) on first visit.
- **Implementation**: Styled using semantic CSS custom properties (`--bg-primary`, `--text-primary`, `--card-bg`, `--border-color`, etc.) attached to `html.dark`.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher; tested on v24.19.0)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher; tested on v11.17.0)

---

## Installation & Setup

Clone or open the repository workspace, then install the project dependencies:

```bash
npm install
```

---

## Environment Configuration

Copy the example environment template `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### Configurable Variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for the Express server |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `API_BASE_URL` | `http://localhost:3000` | Root API URL |

*Note: No proprietary secrets or external API keys are required to run the prototype. The Learning Coach operates using a high-fidelity local rules-based engine.*

---

## Running the Application

### Production / Local Server:
```bash
npm start
```

### Development Mode (with automatic restart on file change):
```bash
npm run dev
```

Open your browser to:
**[http://localhost:3000](http://localhost:3000)**

---

## Running Configured Checks

The repository includes an automated integration test suite that verifies the healthcheck, courses API, search filtering, learning paths, questionnaire generator, internships filtering, and coach diagnostic queries:

```bash
npm test
```

Or run:
```bash
npm run check
```

---

## Course Showcase (Layout & Motion Reference)

The featured course showcase near the top of the home page incorporates the layout and motion inspiration of a prominent media carousel while strictly maintaining SkillPath's Kinetic Horizon identity:
- **Layout**: Wide hero container featuring badges, bold title, description, course metadata (Level, Duration, Language, Certificate Price), primary action button ("Explore Course") with direct link to the provider, and secondary "View Learning Path" shortcut.
- **16:9 Course Media**: High-resolution, professional local artwork generated for each featured subject (Python, Data Analysis, Web Development, UI/UX, PostgreSQL, Digital Marketing, Spanish).
- **Motion & Accessibility**:
  - Auto-advances every 5 seconds.
  - Pauses automatically when the user hovers over the showcase or focuses interactive controls.
  - Pauses when the browser tab is hidden or minimized (`document.visibilityState === 'hidden'`).
  - Respects the user's OS `prefers-reduced-motion: reduce` preference.
  - Fully keyboard-accessible with Left/Right arrow keys.

---

## Internships Directory

Located directly beneath the hero showcase, the Internships section provides vetted and sample early-career opportunities:
- **Filters**: Quickly filter by *All*, *Remote Only*, *In-Person*, *Paid Only*, *Unpaid*, or specific field (*Software Engineering*, *Open Source*, *Data & AI*, *Digital Marketing*, *UI/UX Design*).
- **Transparency**: Clear badge indicators displaying Remote status, Compensation (`Paid Stipend` / `Unpaid Volunteer` / `Unknown`), Application Deadlines, and Verification Status.
- **Direct Application Links**: External links directing learners to official foundation application portals.

---

## Interactive Learning Coach

The Learning Coach (`#coachModal`) is designed to assist learners who are undecided or overwhelmed:
- **Diagnostic Flow**: Solicits learner constraints through 4 structured steps:
  1. *Primary Goal / Target Domain* (Software Engineering, Data Science, Web Development, UI/UX, or "Not Sure").
  2. *Experience Level* (Absolute Beginner, Basic Familiarity, Intermediate).
  3. *Weekly Time Commitment* (5 hrs/week casual up to 25+ hrs/week intensive).
  4. *Budget & Certificate Preference* ($0 Free Only, Free to Audit, Low-Cost, or Employer-Sponsored).
- **Rules-Based Engine**: Matches constraints against SkillPath's catalog and returns:
  - Recommended learning path.
  - Detailed rationale explaining why this trajectory fits their schedule and budget.
  - Transparent low-cost alternatives (e.g. Free Coursera Audit + freeCodeCamp practice).
  - Direct links to relevant courses and internship opportunities.
- **AI LLM Upgrade (Claude, Gemini, or OpenAI)**:
  The coach automatically upgrades from rules-based answers to live LLM-generated answers once a key is present:
  1. Add `ANTHROPIC_API_KEY=...` (Claude), `GEMINI_API_KEY=...`, or `OPENAI_API_KEY=...` to `.env`. Claude is checked first if multiple keys are set.
  2. `backend/services/coachService.js`'s `callAIServiceIfConfigured()` sends the full seed catalog as grounding context so answers stay accurate to SkillPath's verified courses/internships instead of hallucinating.
  3. If the call fails, times out, or no key is set, the coach silently falls back to the deterministic rules-based engine - no user-facing errors.
  4. The API key is read server-side only (`process.env`) and is never sent to the frontend.

---

## Distinct Learning Path Generation

SkillPath generates unique, tailored roadmaps rather than returning a static template:
- **Personalization Inputs**: Goal subject, experience level, weekly hours, budget tier, learning style (Hands-on, Video-based, Reading-based), and credential preference.
- **Pacing**: Estimated completion time dynamically scales based on hours committed (e.g., 5 hrs/week stretches duration; 25 hrs/week compresses into an intensive track).
- **Pedagogical Sequence**:
  1. *Foundations & Prerequisites*: Core syntax or theoretical primitives.
  2. *Deep Dive & Core Skills*: Comprehensive course or tutorial modules.
  3. *Hands-on Practice & Sandboxes*: LeetCode, Kaggle, or interactive browser sandboxes.
  4. *Capstone Project*: Production-grade portfolio pieces.
  5. *Certification Milestone*: Optional credential exam or free open-source badge.
- **Alternatives & Budget Toggle**: Each step contains rationale notes and $0 free alternative tracks.

---

## User Accounts & Personalization (Firebase)

SkillPath works fully anonymously (guest mode) by default - browsing courses, generating a path, and using the Coach all work with no account. Signing in (email/password or Google, via the "Sign In" button in the header) unlocks per-account persistence, powered by Firebase Authentication + Firestore:
- **Personalized path memory**: The most recently generated roadmap and questionnaire answers are saved to the user's account and automatically restored the next time they sign in on any device.
- **Daily learning streak**: A 🔥 streak badge in the header counts consecutive days the user has opened the app while signed in (`frontend/js/userData.js` → `recordDailyActivity`).
- **Data isolation**: Firestore Security Rules (`firestore.rules`) restrict every user to reading/writing only their own `users/{uid}` document - nobody, including other signed-in users, can read anyone else's data.
- **Client-only integration**: This is entirely client-side (Firebase JS SDK loaded via CDN in `index.html`, wired in `frontend/js/auth.js` and `frontend/js/userData.js`) - no backend changes were needed. Until you configure a real Firebase project, `frontend/js/firebase-config.js` still holds placeholder values, so sign-in quietly stays disabled and the app runs exactly as before (guest-only).

See **Firebase Setup** below to actually enable this.

---

## Firebase Setup (Login, Streaks & Per-User Data)

Follow this once to turn on real accounts. It's entirely done through the Firebase Console - no paid tier is required for this usage level (Spark/free plan covers Auth + Firestore at prototype scale).

1. **Create a Firebase project**: go to [console.firebase.google.com](https://console.firebase.google.com) → *Add project* → give it a name → Google Analytics is optional (safe to skip) → *Create project*.
2. **Register a Web App**: in the new project, click the **`</>`** (Web) icon → give it a nickname (e.g. "SkillPath Web") → you don't need Firebase Hosting → *Register app*. Firebase shows you a `firebaseConfig` object.
3. **Set the config via env vars**: copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env`, then fill in `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, and `FIREBASE_MEASUREMENT_ID` from that `firebaseConfig` object. Running `npm run build` (or `npm run dev`/`npm start`, which run it automatically) inside `frontend/` generates `frontend/js/firebase-config.js` from these values via `frontend/scripts/generate-firebase-config.js`.
4. **Enable sign-in providers**: *Build → Authentication → Get started → Sign-in method* tab → enable **Email/Password** → enable **Google** (pick a project support email when prompted) → *Save* for each.
5. **Create the database**: *Build → Firestore Database → Create database* → choose **Start in production mode** → pick a location → *Enable*.
6. **Apply security rules**: in Firestore Database → **Rules** tab, replace the contents with everything in [`firestore.rules`](firestore.rules) (repo root) → *Publish*.
7. **Authorize your deployed domain** (only needed for Google Sign-In on a real domain - `localhost` is already authorized by default): *Authentication → Settings → Authorized domains → Add domain* → add your Vercel URL (e.g. `skillpath.vercel.app`) once you've deployed it.
8. **Test it**: run the app locally (`npm start`), click **Sign In** in the header → try **Sign Up** with an email/password, or **Continue with Google** → confirm the 🔥 streak badge appears and generate a path, reload the page, and confirm it's still there.
9. **On Vercel**, set the same `FIREBASE_*` keys under Project Settings → Environment Variables instead of committing `frontend/.env` - the project's `frontend/vercel.json` already runs `npm run build` to regenerate `firebase-config.js` from them on every deploy.

**Note on the config values**: the `apiKey` etc. are meant to be public and shipped in client code - Firebase's security model enforces access through Authentication + the Firestore Rules from step 6, not by keeping these values secret. Routing them through env vars is about keeping project-specific values out of committed source and making it easy to swap projects per environment, not about hiding a real secret. Don't confuse it with the `ANTHROPIC_API_KEY` in the root `.env`, which *is* a real secret and must never appear in frontend code.

**Optional future upgrade**: everything above is client-side only. If you later add an Express endpoint that needs to know *which* signed-in user is calling it (rather than just storing their data directly in Firestore from the browser), verify their Firebase ID token server-side with the `firebase-admin` SDK in an Express middleware - not implemented here, since nothing currently needs it.

---

## Database & Seed Data Model

### Data Architecture
Course, internship, and roadmap data is organized in [`server/data/seed.json`](file:///c:/Users/harsh/Downloads/stitch_skillpath_learning_planner/server/data/seed.json).

### Schema Structure
- **Courses**: `id`, `title`, `provider`, `url`, `subject`, `level`, `duration`, `language`, `coursePrice`, `isCourseFree`, `certificatePrice`, `certificateStatus`, `thumbnail`, `practiceLinks`, `source`, `lastVerified`, `isVerified`, `isFeatured`, `auditTip`, `description`, `tags`.
- **Internships**: `id`, `title`, `company`, `location`, `remoteStatus`, `compensation`, `stipendDetails`, `duration`, `deadline`, `url`, `source`, `field`, `isVerified`, `description`, `tags`.

---

## API Route Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and timestamp |
| `GET` | `/api/courses` | Search courses with query params: `search`, `subject`, `level`, `price`, `featured` |
| `GET` | `/api/courses/stats` | Summary statistics (total, verified count, sample count, subjects) |
| `GET` | `/api/courses/:id` | Retrieve single course by ID |
| `GET` | `/api/internships` | Retrieve internships with query params: `search`, `remote`, `paid`, `field` |
| `GET` | `/api/internships/stats` | Internship statistics (total, verified, sample, remote, paid) |
| `GET` | `/api/coach/presets` | Retrieve quick-start diagnostic scenarios |
| `POST` | `/api/coach/recommend` | Evaluate learner answers and generate personalized recommendations |
| `GET` | `/api/paths` | Retrieve all curated learning paths |
| `GET` | `/api/paths/:id` | Retrieve learning path by ID |
| `POST` | `/api/paths/generate` | Generate customized distinct path from constraint questionnaire |
| `PATCH` | `/api/paths/:id/stages/:stage/tasks/:taskId` | Toggle task completion status in a milestone |
| `POST` | `/api/paths/:id/stages/:stage/validate` | Mark module stage as completed/validated |

---

## Verification Registry (Courses & Internships)

### Featured & Verified Courses

| Course / Resource | Provider | Subject | Tuition | Certificate | Verification Status | Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CS50's Intro to Programming with Python** | Harvard University / edX | Python | Free ($0) | Optional $299 edX / Free Harvard cert | **Verified** (2025-03-01) | Harvard Online Catalog |
| **Python for Everybody (PY4E)** | Univ. of Michigan / Coursera | Python | Free ($0) | $49/mo Coursera / Free at py4e.com | **Verified** (2025-03-05) | PY4E Open Access |
| **Google Data Analytics Professional Cert** | Google / Coursera | Data Analysis | Free to Audit | $39/mo subscription | **Verified** (2025-03-10) | Grow with Google |
| **Relational Database Cert (PostgreSQL)** | freeCodeCamp | Data Analysis | Free ($0) | 100% Free Verified Credential | **Verified** (2025-03-12) | freeCodeCamp Curriculum |
| **The Odin Project: Foundations & Full-Stack** | The Odin Project | Web Dev | Free ($0) | None (GitHub Portfolio Only) | **Verified** (2025-03-14) | The Odin Project Docs |
| **Responsive Web Design Certification** | freeCodeCamp | Web Dev | Free ($0) | 100% Free Verified Certificate | **Verified** (2025-03-15) | freeCodeCamp Catalog |
| **Google Digital Marketing & E-commerce** | Google / Coursera | Digital Marketing | Free to Audit | $39/mo subscription | **Verified** (2025-03-16) | Grow with Google |
| **HubSpot Inbound Marketing Certification** | HubSpot Academy | Digital Marketing | Free ($0) | 100% Free Recognized Badge | **Verified** (2025-03-16) | HubSpot Academy |
| **Google UX Design Professional Cert** | Google / Coursera | UI/UX | Free to Audit | $39/mo subscription | **Verified** (2025-03-14) | Grow with Google |
| **UI / UX Design Specialization** | CalArts / Coursera | UI/UX | Free to Audit | $49/mo subscription | **Verified** (2025-03-10) | CalArts Catalog |
| **FSI Conversational Spanish Fast-Track** | Foreign Service Inst. | Languages | Free ($0) | Public Domain OER | **Verified** (2025-03-12) | FSI Open Culture Archive |
| **FSI Conversational French & Phonetics** | Foreign Service Inst. | Languages | Free ($0) | Public Domain OER | **Verified** (2025-03-15) | FSI / TV5Monde |
| **AWS Cloud Practitioner Essentials** | AWS Skill Builder | Cloud | Free ($0) | $100 Pearson VUE Exam | *Sample Listing* | AWS Skill Builder |

### Verified & Sample Internships

| Opportunity | Host / Foundation | Location | Compensation | Verification Status | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Outreachy Open Source Internship** | Software Freedom Conservancy | Remote (Global) | Paid ($7,000 stipend) | **Verified** (2025-03-15) | [Outreachy Official Portal](https://www.outreachy.org) |
| **Google Summer of Code (GSoC)** | Google Open Source Programs | Remote (Global) | Paid (Stipend based on country) | **Verified** (2025-03-10) | [GSoC Official Portal](https://summerofcode.withgoogle.com) |
| **LFX Mentorship Program** | Linux Foundation | Remote (Global) | Paid (Stipend provided) | **Verified** (2025-03-12) | [LFX Portal](https://lfx.linuxfoundation.org/tools/mentorship) |
| **MLH Fellowship** | Major League Hacking | Remote (Global) | Paid (Needs-based stipend) | **Verified** (2025-03-14) | [MLH Fellowship](https://fellowship.mlh.io) |
| **UN Online Volunteering** | United Nations (UNV) | Remote (Global) | Unpaid Volunteer | **Verified** (2025-03-12) | [UNV Portal](https://www.unv.org) |
| *Acme Software Engineering Intern* | Acme Digital Labs | San Francisco / Hybrid | Paid ($35/hr) | *Sample Listing* | Sample Listing |
| *GreenTech UI/UX Apprentice* | GreenTech Collective | Remote (US/EU) | Paid ($25/hr) | *Sample Listing* | Sample Listing |

---

## Deployment: Backend on Render, Frontend on Vercel

The `backend/` and `frontend/` folders are independent - each can be deployed to its own host and pointed at the other over HTTPS.

### 1. Deploy the backend to Render

1. Push this repo to GitHub/GitLab and create a new **Web Service** on Render pointing at it.
2. Root Directory: leave as the repo root (Render Blueprint `render.yaml` at the root already defines the service - or configure manually with the settings below).
3. Build Command: `npm install`. Start Command: `npm run start:backend`.
4. Environment variables (Render dashboard → Environment):
   - `NODE_ENV=production`
   - `ANTHROPIC_API_KEY=<your Claude API key>`
   - `CORS_ORIGIN=https://<your-vercel-app>.vercel.app` (add this **after** step 2 below, once you know the Vercel URL; comma-separate multiple origins, e.g. if you also test from a custom domain)
5. Render assigns the port via its own `PORT` env var automatically - no change needed, `backend/server.js` already reads `process.env.PORT`.
6. Once deployed, note your backend URL, e.g. `https://skillpath-backend.onrender.com`. Verify it with `GET /api/health`.

### 2. Deploy the frontend to Vercel

1. Create a new Vercel project from the same repo.
2. **Root Directory**: set to `frontend` (Vercel Project Settings → General → Root Directory). No framework preset needed - it's plain static HTML/CSS/JS. `frontend/vercel.json` already sets the build command to `npm run build`, which runs `frontend/scripts/generate-firebase-config.js` to generate `js/firebase-config.js` from the `FIREBASE_*` environment variables below.
3. **Environment variables** (Vercel dashboard → Project Settings → Environment Variables) - see [`frontend/.env.example`](frontend/.env.example):
   - `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID` - from your Firebase project's Web App config (see **Firebase Setup** above).
4. Before (or after) deploying, edit [`frontend/js/config.js`](frontend/js/config.js) and set:
   ```js
   window.SKILLPATH_API_BASE_URL = 'https://skillpath-backend.onrender.com';
   ```
   using your actual Render URL from step 1, then commit and redeploy.
5. Once deployed, note your frontend URL, e.g. `https://skillpath.vercel.app`, and set it as `CORS_ORIGIN` on the Render backend (step 1.4) so the browser is allowed to call the API cross-origin.

### Notes

- Locally, `npm start` (repo root) still runs the Express backend, which serves the frontend directly from the same origin - `config.js`'s default empty string keeps using the relative `/api` path in that case, so nothing changes for local dev.
- The backend now detects whether `frontend/` is present next to it (`backend/server.js`) - if you deploy only the `backend/` folder in isolation, it simply runs as an API-only service instead of erroring on a missing `index.html`.
- **Third-Party Data Sync**: To integrate live internship feeds, register for official APIs (e.g. Adzuna, LinkedIn Jobs API, or GitHub Jobs archives) and plug into `backend/services/internshipService.js`.
- **Database Storage (Optional)**: For user login and cross-device sync of roadmap progress, connect Prisma or Sequelize to PostgreSQL or SQLite instead of `backend/data/seed.json`.
