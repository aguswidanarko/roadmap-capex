const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('./db'); // ensures DB is initialized/seeded on boot
const { login } = require('./auth');
const buildingsRoutes = require('./routesBuildings');
const roadmapRoutes = require('./routesRoadmap');
const masterRoutes = require('./routesMaster');
const syncRoutes = require('./routesSync');
const reportsRoutes = require('./routesReports');
const miscRoutes = require('./routesMisc');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => res.json({ ok: true, service: 'capex-roadmap-api', time: new Date().toISOString() }));

// POST /auth/login (WEB-001 / MOB-001)
app.post('/auth/login', login);

// Serve the built Web Dashboard (web-dashboard/dist copied here at build time) so the whole
// app — API + UI — runs from a single origin/port. Makes local testing and deployment to any
// single-service host (Render, Railway, Fly.io, etc.) a one-process affair.
// express.static only ever matches real files (assets/*, favicon.svg, index.html for "/"), so it's
// safe to register before the auth-guarded API routers below without needing an API-path allowlist.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const hasPublicDir = fs.existsSync(PUBLIC_DIR);
if (hasPublicDir) app.use(express.static(PUBLIC_DIR));

app.use(buildingsRoutes);
app.use(roadmapRoutes);
app.use(masterRoutes);
app.use(syncRoutes);
app.use(reportsRoutes);
app.use(miscRoutes);

// SPA fallback — registered AFTER every API router, so it only ever catches a GET that no API
// route matched (e.g. a hard refresh on the frontend's HashRouter, which only ever requests "/").
// No hard-coded prefix list to keep in sync with routers: whatever the routers didn't claim, this does.
if (hasPublicDir) {
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CAPEX Roadmap API${hasPublicDir ? ' + Web Dashboard' : ''} listening on http://localhost:${PORT}`));
