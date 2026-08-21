// Maps free-text building_type labels coming from document-derived imports (e.g. the
// PT. SAM 2 campus map -> Excel conversion) onto the app's canonical 21-item "Jenis
// Bangunan" taxonomy (see seedData.js roadmapTypeSummary), so the dashboard/roadmap
// aggregate tables group them correctly instead of showing them as stray extra rows.
// The specific facility name is preserved separately in `capital`.
const JENIS_BANGUNAN_REMAP = {
  Klinik: 'Fasilitas Kesehatan',
  Masjid: 'Rumah Ibadah',
  'Sport Center': 'Fasilitas Olahraga',
  'TPA (Tempat Pembuangan Akhir)': 'Fasilitas Umum',
  Lapangan: 'Fasilitas Olahraga',
  Mushalah: 'Rumah Ibadah',
  'Rumah Genset': 'Instalasi Listrik',
  Gereja: 'Rumah Ibadah',
  TK: 'Sekolah',
  'SD (Sekolah Dasar)': 'Sekolah',
  'Gudang LB3': 'Gudang',
  Timbangan: 'Fasilitas Umum',
  'Bangunan (tanpa label, atap merah)': 'Fasilitas Umum',
};

function normalizeJenisBangunan(buildingType) {
  if (!buildingType) return buildingType;
  return JENIS_BANGUNAN_REMAP[buildingType] || buildingType;
}

module.exports = { JENIS_BANGUNAN_REMAP, normalizeJenisBangunan };
