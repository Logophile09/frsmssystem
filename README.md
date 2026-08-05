# FRSMS v2 — Fire And Rescue Service Management System

Rebuild of the original PHP/MySQL FRSMS on the target stack:

- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Node.js / Express (REST API)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Version control:** Git / GitHub
- **Hosting:** Netlify (frontend) — backend needs a Node host (Render, Railway, Fly.io, etc. — Netlify itself only serves static sites + its own serverless functions, see note at the bottom)

Modules covered: Dashboard, Incidents & Dispatch, Personnel, Vehicles, Equipment,
Attendance, Staff Accounts (RBAC), GPS Tracker (IoT), AI False-Alarm Detection
(transparent rule-based scoring), Reports, and the Fire Safety Compliance suite
(Establishments, Inspections, Certificates, Violations).

## Architecture

```
Browser (React) --Supabase Auth (login only)--> Supabase Auth
       |
       | REST calls with a Bearer <supabase JWT>
       v
Express API  --service-role key, bypasses RLS--> Supabase Postgres
```

The frontend never talks to Postgres directly and never holds the Supabase
**service role** key. It only uses Supabase for *authentication* (login,
session, JWT). Every data read/write goes through the Express REST API, which
verifies the JWT, loads the caller's role from `profiles`, and only then
touches the database using the service-role key. This keeps a single,
consistent authorization boundary in one place (the backend) instead of
splitting it between RLS policies and app code.

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

**Frontend (Netlify):**
- New site from Git → pick the repo → set base directory to `frontend`
- Build command: `npm run build`, publish directory: `frontend/dist`
- Add the three `VITE_...` env vars in Netlify's site settings

**Backend (Express):** Netlify doesn't run long-lived Node servers, so host
the Express API separately — Render, Railway, or Fly.io all have a free tier
that's a straight `npm install && npm run build && npm start` deploy. Point
`VITE_API_URL` at wherever it ends up, and set `CORS_ORIGIN` on the backend to
your Netlify URL.

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
session instead, for demoing without hardware. The live map is a schematic
SVG (no external map API/key needed), same approach as the original app.
