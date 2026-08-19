# FRSMS v2 — Fire And Rescue Service Management System

Rebuild of the original PHP/MySQL FRSMS on the target stack:

- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Node.js / Express (REST API)
- **AI-assist:** Groq API — decision-tree analysis narration + incident summary drafting
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Version control:** Git / GitHub
- **Architecture:** Monolithic — one codebase, one deployment
- **Hosting:** Vercel (single project serves the built frontend *and* the
  Express API together — see "Architecture" and "Deploy" below; a split
  Netlify + Render deployment is also documented as an alternative)

Modules covered: Dashboard, Incidents & Dispatch, Decision-Tree Dispatch
Recommendation (with optional Groq-narrated analysis), Personnel, Vehicles,
Equipment, Attendance, Staff Accounts (RBAC), GPS Tracker with geofenced ETA
(IoT), AI False-Alarm Detection (transparent rule-based scoring), Reports, and
the Fire Safety Compliance suite (Establishments, Inspections, Certificates,
Violations).

## Architecture

The system is a **monolith**: one Git repository, one Vercel project, one
deployment. `frontend/` and `backend/` are source-code folders inside that
single codebase, not independently-hosted services — `api/[...all].ts` at the
repo root wraps the same Express app that `backend/src/server.ts` runs, and
Vercel serves it as one serverless function alongside the static frontend
build. There's a single build pipeline, a single `git push` deploy, and a
single production URL, which is what keeps this appropriate for a
single-team, 12-week pilot scope instead of introducing multi-service
operational overhead (see `backend/src/server.ts` and root `vercel.json`).

```
                         ┌───────────────────────────────────┐
                         │        ONE Vercel project          │
                         │                                     │
Browser ── static SPA ──▶│  frontend/dist  (React build)       │
   │                     │                                     │
   │  REST calls,        │  api/[...all].ts                    │
   │  Bearer <JWT>        ──▶  → backend/src/server.ts (Express) │
   ▼                     │        ├─ decision-tree dispatch     │
Supabase Auth             │        ├─ false-alarm scoring        │
(login only)               │        ├─ geofenced ETA              │
                          │        └─ Groq API (AI-assist)        │
                         └──────────────┬──────────────────────┘
                                        │ service-role key, bypasses RLS
                                        ▼
                               Supabase Postgres
```

The frontend never talks to Postgres directly and never holds the Supabase
**service role** key. It only uses Supabase for *authentication* (login,
session, JWT). Every data read/write goes through the Express API (running as
the `api/[...all].ts` function), which verifies the JWT, loads the caller's
role from `profiles`, and only then touches the database using the
service-role key. This keeps a single, consistent authorization boundary in
one place (the backend layer) instead of splitting it between RLS policies
and app code — the layering is still MVC-style (presentation / business logic
/ data access), it's just deployed as one unit rather than as separate
services.

For **local development** you still run `frontend/` and `backend/` as two
processes (see steps 3–4 below) — that's just a dev-server convenience (hot
reload on two different ports); the deployed artifact is one monolith.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's up, open **SQL Editor** and run the whole contents of
   `supabase/schema.sql`. This creates every table, enum, index, RLS policy,
   and seed/demo data.
3. Open **Project Settings → API** and note down:
   - `Project URL` → used as `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon public` key → used as `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → used as `SUPABASE_SERVICE_ROLE_KEY` (backend only —
     **never** put this in the frontend `.env`)

## 2. Create your first admin login

The schema seeds personnel/vehicles/incidents demo data, but it can't create
a Supabase Auth login for you (Auth users aren't plain SQL rows). Do this once:

1. In Supabase Studio: **Authentication → Users → Add user**. Set an email and
   password, and check "Auto Confirm User".
2. Copy the new user's UID (shown in the users list).
3. Back in **SQL Editor**, run:
   ```sql
   insert into profiles (id, username, full_name, role, status)
   values ('PASTE-THE-UID-HERE', 'admin', 'System Administrator', 'admin', 'active');
   ```
4. That's your first login. Once you're in, use **Staff Accounts** in the app
   to create everyone else — it calls the Supabase Auth admin API for you.

## 3. Run the backend

```bash
cd backend
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CORS_ORIGIN
npm install
npm run dev        # http://localhost:4000
```

## 4. Run the frontend

```bash
cd frontend
cp .env.example .env.local
# edit .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev         # http://localhost:5173
```

Log in with the admin email/password you created in step 2.

## 5. Version control

```bash
cd frsms-v2
git init
git add .
git commit -m "Initial FRSMS v2 rebuild"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/frsms-v2.git
git push -u origin main
```

Add a `.gitignore` (below) before your first commit so `.env` files and
`node_modules` never get pushed.

```
node_modules/
dist/
.env
.env.local
```

## 6. Deploy

### Primary: single Vercel project (monolith)

This is the deployment the architecture above describes — one project, one
build, one URL for both the frontend and the API.

1. On [vercel.com](https://vercel.com): **New Project** → import the repo.
   Vercel will detect the root `vercel.json`, which points
   `buildCommand`/`outputDirectory` at `frontend/` and auto-detects
   `api/[...all].ts` as a serverless function covering every `/api/*` route.
2. In the project's **Environment Variables**, set:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend, build-time)
   - `VITE_API_URL=/api` (relative — same project serves both, no separate host)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend function, server-side only)
   - `GROQ_API_KEY` (backend function — enables the two Groq AI-assist
     buttons; the rest of the system works without it)
   - `CORS_ORIGIN` — optional here since same-origin requests don't need CORS,
     but harmless to set to the deployed URL
3. Deploy. Every push to the connected branch redeploys the whole monolith —
   frontend and API together, always in sync, with no risk of the two
   drifting out of version with each other the way two separately-deployed
   services could.

### Alternative: split frontend/backend hosting

If you'd rather run the frontend and API as two independently-scaled
services (e.g. to put the API on a host with a longer-lived free tier),
the code also supports that split — `backend/` is a standalone Express app
and `frontend/` is a standalone Vite SPA, so:

**Frontend (Netlify):** New site from Git → base directory `frontend` → build
command `npm run build` → publish directory `frontend/dist` → set the three
`VITE_...` env vars (with `VITE_API_URL` pointing at wherever the backend
below ends up).

**Backend (Render/Railway/Fly.io):** these hosts run long-lived Node
processes, so `backend/` deploys there as a plain `npm install && npm run
build && npm start` service (see `backend/render.yaml` for a Render config
example). Set `CORS_ORIGIN` to the Netlify URL, since this path *does* need
CORS (two different origins, unlike the single-Vercel-project path above).

## Notes on the AI False-Alarm scoring

`backend/src/lib/falseAlarmScoring.ts` is a **transparent, rule-based**
weighted scorer (not a black-box ML model) — the same design as the original
system, deliberately, so dispatch can see exactly why an incident got the
score it did. It weighs severity, keyword matches in the description
("test", "drill", "trapped", "casualties", …), time-of-day, and repeat false
alarms previously confirmed at the same location. Every point it adds or
subtracts is returned in `factors` and shown in the False Alarm Review screen.

## Notes on the GPS Tracker module

`gps_ping.php`'s role is now `POST /api/gps/ping` on the Express backend —
a machine-to-machine endpoint authenticated with `device_code` + `device_token`
(no login/JWT), meant for real IoT hardware to call directly. The in-app
"Simulate Ping" button on the GPS Tracker page uses the normal logged-in
session instead, for demoing without hardware. The live map uses Leaflet with
free CARTO/OpenStreetMap tiles (no API key needed), overlaid with the 142 QC
barangay boundaries (`frontend/src/lib/qcBarangays.json`) for the risk
choropleth.

**Geofenced ETA:** `GET /api/gps/eta?barangay=<name>` (or `?targetLat=&targetLng=`)
in `backend/src/routes/gps.ts`, backed by `backend/src/lib/geofenceEta.ts`,
ranks every located vehicle by estimated time of arrival at a target point —
haversine distance divided by the vehicle's live reported speed (falling back
to a conservative average response speed when parked/idle), plus a fixed
turnout-time buffer — and flags whether the vehicle is currently inside the
same barangay boundary as the target, via a point-in-polygon test against the
same QC barangay GeoJSON used for the map. Surfaced on the GPS Tracker page
as the "Geofenced ETA" panel, for picking the nearest available unit for a
given incident.

## Notes on the Groq API AI-assist features

`GROQ_API_KEY` on the backend enables two assistive (never autonomous)
features, calling the Groq API directly via `backend/src/lib/groqClient.ts`
(OpenAI-compatible chat completions, model defaults to
`llama-3.3-70b-versatile`, overridable with `GROQ_MODEL`):

- **Dispatch decision-tree analysis** (`POST /api/ai/dispatch-analysis`,
  wired into the "Explain this recommendation" button on the Dispatch
  Recommendation page): Groq reads the *same* trace the deterministic
  decision tree (`dispatchRecommendation.ts`) already produced and writes a
  short plain-language explanation for the dispatcher. It never changes which
  units get recommended — the tree's own output stays authoritative; this is
  a narration layer on top of it.
- **Incident summary drafting** (`POST /api/ai/incident-summary`, wired into
  the "Draft with Groq (AI)" button on the Incidents page): drafts a
  report-style paragraph from an incident's fields, for the user to review
  and edit before saving. Nothing is written to the database automatically.

Both endpoints require `requireAuth` like the rest of the API, and both fail
soft (a clear error message, not a crash) if the API key isn't configured —
every other module keeps working normally either way, since the decision
tree and the false-alarm scorer are separate, deterministic code paths that
never call this API.
