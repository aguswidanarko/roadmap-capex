import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { CATEGORY_META, CATEGORY_ORDER } from '../api';
import { db, newLocalUuid, getMaster } from '../db/db';
import { queueBuildingChange, queuePhoto, runSync } from '../db/syncEngine';

const EMPTY = {
  no_unit: '', kebun: 'KAL', rayon: '', afdeling: '', blok: '', capital: '', building_type: '', subtype: '',
  unit_count: 1, pintu: 0, tahun_bangun: '', category_code: 'EX', roadmap_year: '', keterangan_af: '',
  latitude: null, longitude: null, accuracy: null, progress_value: 0, progress_date: '', progress_note: '',
};

export default function BuildingForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const isNew = !uuid || uuid === 'new';
  const [form, setForm] = useState(EMPTY);
  const [types, setTypes] = useState([]);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMaster('building_types').then((t) => setTypes(t || []));
    if (!isNew) {
      db.buildings.get(uuid).then((row) => row && setForm(row));
      db.photos.where('building_uuid').equals(uuid).toArray().then(setExistingPhotos);
    }
  }, [uuid, isNew]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  // MOB-006: GPS coordinate captured automatically on input/update
  function captureGps() {
    if (!navigator.geolocation) { setGpsStatus('unsupported'); return; }
    setGpsStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude);
        update('longitude', pos.coords.longitude);
        update('accuracy', pos.coords.accuracy);
        setGpsStatus('captured');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // MOB-007: photo captured from camera, metadata (time/location) retained
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const recordUuid = isNew ? newLocalUuid() : uuid;
      const building = {
        ...form, uuid: recordUuid,
        unit_count: Number(form.unit_count || 1), pintu: Number(form.pintu || 0),
        tahun_bangun: form.tahun_bangun ? Number(form.tahun_bangun) : null,
        roadmap_year: form.roadmap_year ? Number(form.roadmap_year) : null,
        progress_value: Number(form.progress_value || 0),
        deleted: 0,
      };
      await queueBuildingChange(building, isNew ? 'CREATE' : 'UPDATE');

      if (photoDataUrl) {
        await queuePhoto({
          uuid: newLocalUuid(), building_uuid: recordUuid, data_url: photoDataUrl,
          latitude: form.latitude, longitude: form.longitude, captured_at: new Date().toISOString(),
        });
      }
      runSync();
      navigate('/buildings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell title={isNew ? 'Tambah Bangunan' : 'Edit Bangunan'} sub="Data disimpan lokal dahulu, sync otomatis saat online">
      <form onSubmit={handleSubmit}>
        <div className="card">
          <p className="card-title">Kategori / Sign</p>
          <div className="cat-picker">
            {CATEGORY_ORDER.map((c) => (
              <button
                type="button" key={c}
                className={`cat-chip ${form.category_code === c ? 'selected' : ''}`}
                style={{ background: CATEGORY_META[c].color }}
                onClick={() => update('category_code', c)}
              >{c}</button>
            ))}
          </div>
          {form.category_code === 'AF' && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>Keterangan Alih Fungsi</label>
              <input value={form.keterangan_af || ''} onChange={(e) => update('keterangan_af', e.target.value)} placeholder="Penggunaan baru & pintu" />
            </div>
          )}
        </div>

        <div className="card">
          <p className="card-title">Lokasi</p>
          <div className="field-row">
            <div className="field"><label>Kebun</label><input value={form.kebun} onChange={(e) => update('kebun', e.target.value)} required /></div>
            <div className="field"><label>Rayon</label><input value={form.rayon} onChange={(e) => update('rayon', e.target.value)} required /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Afdeling</label><input value={form.afdeling} onChange={(e) => update('afdeling', e.target.value)} required /></div>
            <div className="field"><label>Blok</label><input value={form.blok} onChange={(e) => update('blok', e.target.value)} required /></div>
          </div>
        </div>

        <div className="card">
          <p className="card-title">Identitas Bangunan</p>
          <div className="field"><label>No. Unit</label><input value={form.no_unit} onChange={(e) => update('no_unit', e.target.value)} required /></div>
          <div className="field">
            <label>Jenis Bangunan</label>
            <input list="building-types" value={form.building_type} onChange={(e) => update('building_type', e.target.value)} required />
            <datalist id="building-types">{types.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div className="field"><label>Capital / Subjenis</label><input value={form.capital} onChange={(e) => update('capital', e.target.value)} required /></div>
          <div className="field-row">
            <div className="field"><label>Unit</label><input type="number" value={form.unit_count} onChange={(e) => update('unit_count', e.target.value)} /></div>
            <div className="field"><label>Pintu</label><input type="number" value={form.pintu} onChange={(e) => update('pintu', e.target.value)} /></div>
          </div>
          <div className="field"><label>Tahun Bangun</label><input type="number" value={form.tahun_bangun || ''} onChange={(e) => update('tahun_bangun', e.target.value)} /></div>
        </div>

        <div className="card">
          <p className="card-title">Roadmap &amp; Progress</p>
          <div className="field">
            <label>Tahun Rencana (2026&ndash;2030)</label>
            <select value={form.roadmap_year || ''} onChange={(e) => update('roadmap_year', e.target.value)}>
              <option value="">&ndash; Tidak ada rencana &ndash;</option>
              {[2026, 2027, 2028, 2029, 2030].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Progress (%): {form.progress_value}%</label>
            <input type="range" min="0" max="100" value={form.progress_value} onChange={(e) => update('progress_value', e.target.value)} />
            <div className="progress-track"><div className="progress-fill" style={{ width: `${form.progress_value}%` }} /></div>
          </div>
          <div className="field"><label>Catatan Progress</label><input value={form.progress_note || ''} onChange={(e) => update('progress_note', e.target.value)} /></div>
        </div>

        <div className="card">
          <p className="card-title">Koordinat GPS</p>
          {form.latitude ? (
            <div className="gps-box">📍 {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)} (±{Math.round(form.accuracy || 0)}m)</div>
          ) : (
            <div className="gps-box">Koordinat belum ditangkap</div>
          )}
          <button type="button" className="btn-big btn-secondary" style={{ marginTop: 10 }} onClick={captureGps}>
            {gpsStatus === 'capturing' ? 'Mengambil lokasi…' : '📍 Tangkap Lokasi GPS'}
          </button>
          {gpsStatus === 'error' && <p style={{ color: 'var(--critical)', fontSize: 12, marginTop: 6 }}>Gagal mengambil lokasi. Periksa izin GPS.</p>}
        </div>

        <div className="card">
          <p className="card-title">Foto Bangunan</p>
          {existingPhotos.map((p) => <img key={p.id} src={p.data_url} className="photo-preview" alt="" />)}
          {photoDataUrl && <img src={photoDataUrl} className="photo-preview" alt="preview" />}
          <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ marginTop: 10 }} />
        </div>

        <button className="btn-big btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan (Offline)'}</button>
        <button type="button" className="btn-big btn-secondary" style={{ marginTop: 8 }} onClick={() => navigate(-1)}>Batal</button>
      </form>
    </MobileShell>
  );
}
