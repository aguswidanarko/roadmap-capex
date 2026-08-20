import Dexie from 'dexie';

// Local database mirroring BRD "Struktur Data Mobile" (section 7 of BRD_Roadmap_CAPEX_Mobile.pdf):
// Building, Location(embedded), Roadmap(embedded), Progress(embedded), Photo, Master, SyncQueue.
export const db = new Dexie('capex_roadmap_mobile');

db.version(1).stores({
  // uuid is the durable local-first identity (MOB local UUID rule, section 10 Offline & Sinkronisasi)
  buildings: 'uuid, no_unit, kebun, rayon, afdeling, blok, category_code, roadmap_year, sync_status, updated_at, deleted',
  photos: '++id, uuid, building_uuid, sync_status, captured_at',
  syncQueue: '++id, record_uuid, entity, status, submitted_at',
  master: 'key',
  session: 'key',
});

export async function getSession() {
  return db.session.get('current');
}

export async function setSession(token, user) {
  await db.session.put({ key: 'current', token, user, savedAt: new Date().toISOString() });
}

export async function clearSession() {
  await db.session.delete('current');
}

export async function getMaster(key) {
  const row = await db.master.get(key);
  return row?.value ?? null;
}

export async function setMaster(key, value) {
  await db.master.put({ key, value, cachedAt: new Date().toISOString() });
}

export function newLocalUuid() {
  return `local-${crypto.randomUUID()}`;
}
