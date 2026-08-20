const express = require('express');
const cors = require('cors');
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

app.use(buildingsRoutes);
app.use(roadmapRoutes);
app.use(masterRoutes);
app.use(syncRoutes);
app.use(reportsRoutes);
app.use(miscRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CAPEX Roadmap API listening on http://localhost:${PORT}`));
