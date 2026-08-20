const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { roadmapTypeSummary, categorySummary, subtypeBreakdown, buildPondok1Buildings } = require('./seedData');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'capex.db');
const isNew = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK(role IN ('viewer','operator','admin','superadmin')),
  scope_kebun TEXT DEFAULT 'ALL',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE,
  no_unit TEXT,
  kebun TEXT, rayon TEXT, afdeling TEXT, blok TEXT,
  capital TEXT,
  building_type TEXT,
  subtype TEXT,
  unit_count INTEGER DEFAULT 1,
  pintu INTEGER DEFAULT 0,
  tahun_bangun INTEGER,
  category_code TEXT CHECK(category_code IN ('BN','EX','AF','BR','BB')),
  estimasi_capital TEXT, estimasi_unit INTEGER, estimasi_pintu INTEGER,
  roadmap_year INTEGER,
  keterangan_af TEXT,
  latitude REAL, longitude REAL, accuracy REAL,
  progress_value REAL DEFAULT 0,
  progress_date TEXT,
  progress_note TEXT,
  sync_status TEXT DEFAULT 'Success',
  source TEXT DEFAULT 'WEB',
  created_by TEXT, created_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT, updated_at TEXT DEFAULT (datetime('now')),
  deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER REFERENCES buildings(id),
  data_url TEXT,
  captured_at TEXT DEFAULT (datetime('now')),
  latitude REAL, longitude REAL,
  uploaded_by TEXT,
  source TEXT DEFAULT 'WEB'
);

CREATE TABLE IF NOT EXISTS roadmap_type_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no INTEGER, jenis_bangunan TEXT,
  existing_td2025 INTEGER, y2026 INTEGER, y2027 INTEGER, y2028 INTEGER, y2029 INTEGER, y2030 INTEGER,
  total_program INTEGER, estimasi_2030 INTEGER
);

CREATE TABLE IF NOT EXISTS subtype_breakdown (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_type TEXT, capital TEXT,
  ex2025 INTEGER, y2026 INTEGER, y2027 INTEGER, y2028 INTEGER, y2029 INTEGER, y2030 INTEGER,
  total INTEGER, est2030 INTEGER
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_uuid TEXT,
  entity TEXT,
  operation TEXT,
  payload TEXT,
  status TEXT DEFAULT 'Pending',
  device TEXT,
  submitted_by TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT UNIQUE,
  filename TEXT,
  total_rows INTEGER, valid_rows INTEGER, invalid_rows INTEGER, duplicate_rows INTEGER,
  status TEXT DEFAULT 'Preview',
  uploaded_by TEXT,
  uploaded_at TEXT DEFAULT (datetime('now')),
  errors_json TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT, record_id TEXT,
  action TEXT,
  old_value TEXT, new_value TEXT,
  user TEXT, source TEXT DEFAULT 'WEB',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

function logAudit({ entity, recordId, action, oldValue, newValue, user, source }) {
  db.prepare(`INSERT INTO audit_log (entity, record_id, action, old_value, new_value, user, source)
    VALUES (?,?,?,?,?,?,?)`).run(entity, String(recordId), action,
    oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, user || 'system', source || 'WEB');
}

if (isNew) {
  console.log('Seeding fresh database with PT. XXX fixture data...');
  const seedUsers = db.transaction(() => {
    const users = [
      { username: 'admin', password: 'admin123', full_name: 'Admin CAPEX', role: 'admin' },
      { username: 'operator', password: 'operator123', full_name: 'Operator Rayon A', role: 'operator' },
      { username: 'viewer', password: 'viewer123', full_name: 'Manajemen Viewer', role: 'viewer' },
      { username: 'superadmin', password: 'super123', full_name: 'Super Admin', role: 'superadmin' },
    ];
    const stmt = db.prepare(`INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)`);
    for (const u of users) stmt.run(u.username, bcrypt.hashSync(u.password, 8), u.full_name, u.role);
  });
  seedUsers();

  const seedRoadmap = db.transaction(() => {
    const stmt = db.prepare(`INSERT INTO roadmap_type_summary
      (no, jenis_bangunan, existing_td2025, y2026, y2027, y2028, y2029, y2030, total_program, estimasi_2030)
      VALUES (@no,@jenis_bangunan,@existing_td2025,@y2026,@y2027,@y2028,@y2029,@y2030,@total_program,@estimasi_2030)`);
    for (const row of roadmapTypeSummary) stmt.run(row);

    const stmt2 = db.prepare(`INSERT INTO subtype_breakdown
      (building_type, capital, ex2025, y2026, y2027, y2028, y2029, y2030, total, est2030)
      VALUES (@building_type,@capital,@ex2025,@y2026,@y2027,@y2028,@y2029,@y2030,@total,@est2030)`);
    for (const row of subtypeBreakdown) stmt2.run(row);
  });
  seedRoadmap();

  const seedBuildings = db.transaction(() => {
    const stmt = db.prepare(`INSERT INTO buildings
      (uuid, no_unit, kebun, rayon, afdeling, blok, capital, building_type, subtype, unit_count, pintu,
       tahun_bangun, category_code, estimasi_capital, estimasi_unit, estimasi_pintu, roadmap_year, keterangan_af,
       latitude, longitude, accuracy, progress_value, progress_date, progress_note, source, created_by)
      VALUES (@uuid,@no_unit,@kebun,@rayon,@afdeling,@blok,@capital,@building_type,@subtype,@unit_count,@pintu,
       @tahun_bangun,@category_code,@estimasi_capital,@estimasi_unit,@estimasi_pintu,@roadmap_year,@keterangan_af,
       @latitude,@longitude,@accuracy,@progress_value,@progress_date,@progress_note,@source,@created_by)`);
    const buildings = buildPondok1Buildings();
    let i = 0;
    for (const b of buildings) {
      i += 1;
      stmt.run({ ...b, uuid: `pondok1-${String(i).padStart(3, '0')}` });
    }
  });
  seedBuildings();

  logAudit({ entity: 'system', recordId: 'seed', action: 'SEED', newValue: { note: 'Initial fixture load: PT. XXX / Pondok 1' }, user: 'system', source: 'IMPORT' });
  console.log('Seed complete: users, roadmap_type_summary, subtype_breakdown, buildings (Pondok 1, 63 units)');
}

module.exports = { db, logAudit, categorySummary };
