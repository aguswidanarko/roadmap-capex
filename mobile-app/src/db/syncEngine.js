import { db, getSession } from './db';
import api from '../api';

const DEVICE_KEY = 'capex_device_id';
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = `device-${crypto.randomUUID().slice(0, 8)}`; localStorage.setItem(DEVICE_KEY, id); }
  return id;
}

let syncing = false;
const listeners = new Set();
export function onSyncChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach((fn) => fn()); }

// Exponential backoff: retry_count -> ms delay (BRD MOB-013 / section 10)
function backoffMs(retryCount) {
  return Math.min(5000 * 2 ** retryCount, 5 * 60 * 1000);
}

export async function queueBuildingChange(building, operation) {
  const now = new Date().toISOString();
  await db.buildings.put({ ...building, operation, sync_status: 'Pending', updated_at: now, retry_count: 0, last_error: null });
  notify();
}

export async function queuePhoto(photo) {
  await db.photos.put({ ...photo, sync_status: 'Pending', captured_at: photo.captured_at || new Date().toISOString() });
  notify();
}

export async function getPendingCounts() {
  const buildings = await db.buildings.where('deleted').notEqual(1).toArray();
  const photos = await db.photos.toArray();
  const count = (arr, s) => arr.filter((r) => r.sync_status === s).length;
  return {
    Pending: count(buildings, 'Pending') + count(photos, 'Pending'),
    Failed: count(buildings, 'Failed') + count(photos, 'Failed'),
    Conflict: count(buildings, 'Conflict'),
    Success: count(buildings, 'Success') + count(photos, 'Success'),
  };
}

export async function runSync({ manual = false } = {}) {
  if (syncing) return { skipped: true };
  if (!navigator.onLine) return { offline: true };
  const session = await getSession();
  if (!session) return { unauthenticated: true };

  syncing = true;
  notify();
  try {
    const device = getDeviceId();
    const pendingBuildings = (await db.buildings.where('sync_status').anyOf('Pending', manual ? 'Failed' : 'Pending').toArray())
      .filter((b) => manual || !b.retry_count || Date.now() - new Date(b.updated_at).getTime() > backoffMs(b.retry_count));

    const records = pendingBuildings.map((b) => ({
      record_uuid: b.uuid,
      entity: 'buildings',
      operation: b.operation || 'CREATE',
      user: session.user.username,
      base_updated_at: b.server_updated_at || null,
      payload: b,
    }));

    if (records.length) {
      const res = await api.post('/sync/batch', { device, records });
      for (const r of res.data.results) {
        const row = await db.buildings.get(r.record_uuid);
        if (!row) continue;
        if (r.status === 'Success') {
          await db.buildings.update(r.record_uuid, { sync_status: 'Success', last_error: null, retry_count: 0 });
        } else {
          await db.buildings.update(r.record_uuid, {
            sync_status: r.status, last_error: r.error, retry_count: (row.retry_count || 0) + 1,
          });
        }
      }
    }

    // Photos can only sync once their building is Success (server needs building.uuid to exist)
    const pendingPhotos = await db.photos.where('sync_status').equals('Pending').toArray();
    for (const p of pendingPhotos) {
      const building = await db.buildings.get(p.building_uuid);
      if (!building || building.sync_status !== 'Success') continue;
      try {
        await api.post('/sync/batch', {
          device,
          records: [{ record_uuid: p.uuid, entity: 'photos', operation: 'CREATE', user: session.user.username,
            payload: { building_uuid: p.building_uuid, data_url: p.data_url, latitude: p.latitude, longitude: p.longitude } }],
        });
        await db.photos.update(p.id, { sync_status: 'Success' });
      } catch (e) {
        await db.photos.update(p.id, { sync_status: 'Failed' });
      }
    }

    return { ok: true, processed: records.length };
  } catch (e) {
    return { error: e.message };
  } finally {
    syncing = false;
    notify();
  }
}

export function isSyncing() { return syncing; }

// Auto-sync when connection returns
window.addEventListener('online', () => runSync());
setInterval(() => runSync(), 30000);
