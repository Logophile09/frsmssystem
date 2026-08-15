// Vercel routes every request under /api/** to this single serverless
// function (the [...all] filename is Vercel's catch-all convention).
// It's the same Express app that runs standalone in `backend/` for local
// dev or a non-Vercel Node host -- see backend/src/server.ts. Express
// apps are directly usable as a Vercel Node function handler, so no
// adapter is needed: importing `app` here and re-exporting it is enough
// for the whole REST API (incidents, dispatch, GPS, false-alarm
// scoring, AI-assist, etc.) to run inside this one Vercel project
// alongside the static frontend build, instead of as a separate service.
import app from '../backend/src/server';

export default app;
