import { useState } from 'react';
import api, { CATEGORY_ORDER } from '../api';

const EMPTY = {
  no_unit: '', kebun: 'KAL', rayon: '', afdeling: '', blok: '', capital: '', building_type: '', subtype: '',
  unit_count: 1, pintu: 0, tahun_bangun: '', category_code: 'EX', roadmap_year: '', keterangan_af: '',
  latitude: '', longitude: '', progress_value: 0, progress_date: '', progress_note: '',
};

export default function BuildingModal({ building, onClose, onSaved }) {
  const [form, setForm] = useState(building ? { ...EMPTY, ...building } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, source: 'WEB' };
      if (building) await api.put(`/buildings/${building.id}`, payload);
      else await api.post('/buildings', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{building ? 'Edit Bangunan' : 'Tambah Bangunan'}</h2>
        {error && <div className="login-error">{error}</div>}
        <div className="form-grid">
          <div><label>No. Unit</label><input value={form.no_unit} onChange={(e) => update('no_unit', e.target.value)} required /></div>
          <div>
            <label>Kategori (Sign)</label>
            <select value={form.category_code} onChange={(e) => update('category_code', e.target.value)}>
              {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label>Kebun</label><input value={form.kebun} onChange={(e) => update('kebun', e.target.value)} /></div>
          <div><label>Rayon</label><input value={form.rayon} onChange={(e) => update('rayon', e.target.value)} /></div>
          <div><label>Afdeling</label><input value={form.afdeling} onChange={(e) => update('afdeling', e.target.value)} /></div>
          <div><label>Blok</label><input value={form.blok} onChange={(e) => update('blok', e.target.value)} /></div>
          <div><label>Capital / Jenis Rumah</label><input value={form.capital} onChange={(e) => update('capital', e.target.value)} /></div>
          <div><label>Jenis Bangunan</label><input value={form.building_type} onChange={(e) => update('building_type', e.target.value)} /></div>
          <div><label>Unit</label><input type="number" value={form.unit_count} onChange={(e) => update('unit_count', Number(e.target.value))} /></div>
          <div><label>Pintu</label><input type="number" value={form.pintu} onChange={(e) => update('pintu', Number(e.target.value))} /></div>
          <div><label>Tahun Bangun</label><input type="number" value={form.tahun_bangun || ''} onChange={(e) => update('tahun_bangun', Number(e.target.value))} /></div>
          <div><label>Roadmap Tahun</label>
            <select value={form.roadmap_year || ''} onChange={(e) => update('roadmap_year', e.target.value ? Number(e.target.value) : '')}>
              <option value="">–</option>
              {[2026, 2027, 2028, 2029, 2030].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div><label>Latitude</label><input value={form.latitude || ''} onChange={(e) => update('latitude', e.target.value ? Number(e.target.value) : '')} /></div>
          <div><label>Longitude</label><input value={form.longitude || ''} onChange={(e) => update('longitude', e.target.value ? Number(e.target.value) : '')} /></div>
          <div><label>Progress (%)</label><input type="number" min="0" max="100" value={form.progress_value} onChange={(e) => update('progress_value', Number(e.target.value))} /></div>
          <div><label>Tanggal Progress</label><input type="date" value={form.progress_date || ''} onChange={(e) => update('progress_date', e.target.value)} /></div>
          <div className="full"><label>Catatan Progress</label><input value={form.progress_note || ''} onChange={(e) => update('progress_note', e.target.value)} /></div>
          {form.category_code === 'AF' && (
            <div className="full"><label>Keterangan Alih Fungsi</label><input value={form.keterangan_af || ''} onChange={(e) => update('keterangan_af', e.target.value)} placeholder="Penggunaan baru & jumlah pintu" /></div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}
