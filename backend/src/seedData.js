// Seed data extracted from "Roadmap KAL New.pdf" (source BRD example, PT. XXX)
// PT. XXX company-wide roadmap rollup by building type (2026-2030)
const roadmapTypeSummary = [
  { no: 1, jenis_bangunan: 'Rumah', existing_td2025: 325, y2026: 26, y2027: 11, y2028: 8, y2029: 0, y2030: 0, total_program: 45, estimasi_2030: 370 },
  { no: 2, jenis_bangunan: 'Mess', existing_td2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 1 },
  { no: 3, jenis_bangunan: 'Kantor', existing_td2025: 5, y2026: 0, y2027: 1, y2028: 0, y2029: 0, y2030: 0, total_program: 1, estimasi_2030: 6 },
  { no: 4, jenis_bangunan: 'TC', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 5, jenis_bangunan: 'R&D', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 6, jenis_bangunan: 'Gudang', existing_td2025: 7, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 1, estimasi_2030: 8 },
  { no: 7, jenis_bangunan: 'Traksi', existing_td2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 2 },
  { no: 8, jenis_bangunan: 'PKS', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 9, jenis_bangunan: 'Keamanan', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 10, jenis_bangunan: 'Instalasi Air Minum', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 11, jenis_bangunan: 'Instalasi Air Bersih', existing_td2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 1, estimasi_2030: 1 },
  { no: 12, jenis_bangunan: 'Instalasi Listrik', existing_td2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 2 },
  { no: 13, jenis_bangunan: 'Rumah Ibadah', existing_td2025: 7, y2026: 2, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 2, estimasi_2030: 9 },
  { no: 14, jenis_bangunan: 'Sekolah', existing_td2025: 7, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 7 },
  { no: 15, jenis_bangunan: 'Fasilitas Kesehatan', existing_td2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 1 },
  { no: 16, jenis_bangunan: 'Fasilitas Anak', existing_td2025: 2, y2026: 2, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 2, estimasi_2030: 4 },
  { no: 17, jenis_bangunan: 'Fasilitas Olahraga', existing_td2025: 1, y2026: 3, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 3, estimasi_2030: 4 },
  { no: 18, jenis_bangunan: 'Fasilitas Rumah', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
  { no: 19, jenis_bangunan: 'Fasilitas Kantor', existing_td2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 1, estimasi_2030: 1 },
  { no: 20, jenis_bangunan: 'Fasilitas Koperasi', existing_td2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 1 },
  { no: 21, jenis_bangunan: 'Fasilitas Umum', existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 },
];

// Category (pelaksanaan) rollup from source: BN=55, EX=361, AF=0, BR=0, BB=1 -> total 417
const categorySummary = { BN: 55, EX: 361, AF: 0, BR: 0, BB: 1 };

// Building sub-type breakdown (from "PT. XXX - Roadmap Detail" page 2 of the source deck)
const subtypeBreakdown = [
  { building_type: 'Rumah', capital: 'Rumah G1', ex2025: 17, y2026: 2, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 2, est2030: 19 },
  { building_type: 'Rumah', capital: 'Rumah G4', ex2025: 47, y2026: 24, y2027: 11, y2028: 8, y2029: 0, y2030: 0, total: 43, est2030: 90 },
  { building_type: 'Rumah', capital: 'Barak G1', ex2025: 199, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 199 },
  { building_type: 'Rumah', capital: 'Barak G2', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Rumah', capital: 'Barak G4', ex2025: 5, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 5 },
  { building_type: 'Rumah', capital: 'Barak G8', ex2025: 18, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 18 },
  { building_type: 'Rumah', capital: 'Barak G10', ex2025: 37, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 37 },
  { building_type: 'Mess', capital: 'Mess Direksi', ex2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 1 },
  { building_type: 'Kantor', capital: 'Kantor Rayon', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Kantor', capital: 'Kantor Afdeling', ex2025: 3, y2026: 0, y2027: 1, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 4 },
  { building_type: 'Gudang', capital: 'Gudang Utama', ex2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 1 },
  { building_type: 'Gudang', capital: 'Gudang TUS', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Gudang', capital: 'Gudang Until', ex2025: 2, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 3 },
  { building_type: 'Gudang', capital: 'Gudang BBM', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Traksi', capital: 'Kantor Traksi', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Instalasi Air Bersih', capital: 'Waduk', ex2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 1 },
  { building_type: 'Instalasi Listrik', capital: 'Rumah Genset', ex2025: 2, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 2 },
  { building_type: 'Rumah Ibadah', capital: 'Masjid', ex2025: 1, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 2 },
  { building_type: 'Rumah Ibadah', capital: 'Musholla', ex2025: 3, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 3 },
  { building_type: 'Rumah Ibadah', capital: 'Gereja', ex2025: 3, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 4 },
  { building_type: 'Sekolah', capital: 'Sekolah SD', ex2025: 7, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 7 },
  { building_type: 'Fasilitas Kesehatan', capital: 'Klinik', ex2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 1 },
  { building_type: 'Fasilitas Anak', capital: 'TPA', ex2025: 2, y2026: 2, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 2, est2030: 4 },
  { building_type: 'Fasilitas Olahraga', capital: 'GOR', ex2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 1 },
  { building_type: 'Fasilitas Olahraga', capital: 'Lapangan Badminton', ex2025: 1, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 2 },
  { building_type: 'Fasilitas Olahraga', capital: 'Lapangan Sepakbola', ex2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 1 },
  { building_type: 'Fasilitas Kantor', capital: 'Banner', ex2025: 0, y2026: 1, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 1, est2030: 1 },
  { building_type: 'Fasilitas Koperasi', capital: 'Koperasi', ex2025: 1, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0, est2030: 1 },
];

// Detail bangunan for location "Pondok 1" (Kebun KAL, Rayon A, Afd II, Blok B44B/B45B)
// 63 units total (62 EX + 1 BB), base coordinate 115.8803, -0.841 (jittered per unit for map demo)
function buildPondok1Buildings() {
  const rows = [
    [1, 'Rumah G4', 1, 4, 2025, 'EX'], [2, 'Rumah G4', 1, 4, 2025, 'EX'], [3, 'Kantor Rayon', 1, 1, 2025, 'EX'],
    [4, 'Rumah G4', 1, 4, 2025, 'EX'], [5, 'Rumah G4', 1, 4, 2025, 'EX'], [6, 'Rumah G4', 1, 4, 2025, 'EX'],
    [7, 'Rumah G4', 1, 4, 2025, 'EX'], [8, 'Rumah G4', 1, 4, 2025, 'EX'], [9, 'Rumah G4', 1, 4, 2025, 'EX'],
    [10, 'Rumah G4', 1, 4, 2025, 'EX'], [11, 'Barak G10', 1, 10, 2025, 'EX'], [12, 'Barak G10', 1, 10, 2025, 'EX'],
    [13, 'Barak G1', 1, 1, 2025, 'EX'], [14, 'Barak G1', 1, 1, 2025, 'EX'], [15, 'Barak G8', 1, 8, 2025, 'EX'],
    [16, 'Barak G1', 1, 1, 2025, 'EX'], [17, 'Barak G1', 1, 1, 2025, 'EX'], [18, 'Barak G1', 1, 1, 2025, 'EX'],
    [19, 'Barak G8', 1, 8, 2025, 'EX'], [20, 'Barak G1', 1, 1, 2025, 'EX'], [21, 'Barak G1', 1, 1, 2025, 'EX'],
    [22, 'Barak G1', 1, 1, 2025, 'EX'], [23, 'Barak G1', 1, 1, 2025, 'EX'], [24, 'Barak G1', 1, 1, 2025, 'EX'],
    [25, 'Barak G8', 1, 8, 2025, 'EX'], [26, 'Barak G8', 1, 8, 2025, 'EX'], [27, 'Barak G1', 1, 1, 2025, 'EX'],
    [28, 'Barak G1', 1, 1, 2025, 'EX'], [29, 'Barak G10', 1, 10, 2025, 'EX'], [30, 'Barak G1', 1, 1, 2025, 'EX'],
    [31, 'Barak G10', 1, 10, 2025, 'EX'], [32, 'Barak G8', 1, 8, 2025, 'EX'], [33, 'Barak G1', 1, 1, 2025, 'EX'],
    [34, 'Barak G1', 1, 1, 2025, 'EX'], [35, 'Barak G1', 1, 1, 2025, 'EX'], [36, 'Musholla', 1, 1, 2025, 'EX'],
    [37, 'Barak G10', 1, 10, 2025, 'EX'], [38, 'Barak G10', 1, 10, 2025, 'EX'], [39, 'Barak G10', 1, 10, 2025, 'EX'],
    [40, 'Barak G10', 1, 10, 2025, 'EX'], [41, 'Barak G1', 1, 1, 2025, 'EX'], [42, 'Barak G1', 1, 1, 2025, 'EX'],
    [43, 'Barak G1', 1, 1, 2025, 'EX'], [44, 'Barak G1', 1, 1, 2025, 'EX'], [45, 'Barak G1', 1, 1, 2025, 'EX'],
    [46, 'Barak G1', 1, 1, 2025, 'EX'], [47, 'Barak G1', 1, 1, 2025, 'EX'], [48, 'Barak G1', 1, 1, 2025, 'EX'],
    [49, 'Barak G1', 1, 1, 2025, 'EX'], [50, 'Barak G1', 1, 1, 2025, 'EX'], [51, 'Barak G10', 1, 10, 2025, 'EX'],
    [52, 'Gereja', 1, 1, 2025, 'EX'], [53, 'Barak G4', 1, 4, 2025, 'EX'], [54, 'Barak G4', 1, 4, 2025, 'EX'],
    [55, 'Barak G1', 1, 1, 2025, 'EX'], [56, 'Barak G10', 1, 10, 2025, 'EX'], [57, 'Barak G10', 1, 10, 2025, 'EX'],
    [58, 'Barak G4', 1, 4, 2025, 'EX'], [59, 'TPA', 1, 1, 2026, 'BB'], [60, 'Barak G10', 1, 10, 2025, 'EX'],
    [61, 'Barak G1', 1, 1, 2025, 'EX'], [62, 'Barak G1', 1, 1, 2025, 'EX'], [63, 'Rumah Genset', 1, 0, 2025, 'EX'],
  ];
  const typeOf = (capital) => {
    if (capital.startsWith('Rumah G') || capital.startsWith('Barak')) return 'Rumah';
    if (capital === 'Kantor Rayon') return 'Kantor';
    if (capital === 'Musholla' || capital === 'Gereja') return 'Rumah Ibadah';
    if (capital === 'TPA') return 'Fasilitas Anak';
    if (capital === 'Rumah Genset') return 'Instalasi Listrik';
    return 'Lainnya';
  };
  const baseLat = -0.841, baseLon = 115.8803;
  return rows.map(([noUnit, capital, unit, pintu, tahun, sign], idx) => {
    const angle = (idx / rows.length) * Math.PI * 2;
    const radius = 0.0015 + (idx % 5) * 0.0004;
    return {
      no_unit: String(noUnit),
      kebun: 'KAL', rayon: 'A', afdeling: 'II', blok: idx < 26 ? 'B44B' : 'B45B',
      capital,
      building_type: typeOf(capital),
      subtype: capital,
      unit_count: unit, pintu,
      tahun_bangun: tahun,
      category_code: sign,
      estimasi_capital: capital, estimasi_unit: unit, estimasi_pintu: pintu,
      roadmap_year: sign === 'BB' ? 2026 : null,
      biaya: sign === 'BB' ? 250000000 : 0,
      keterangan_af: null,
      latitude: baseLat + Math.sin(angle) * radius,
      longitude: baseLon + Math.cos(angle) * radius,
      accuracy: 5 + (idx % 10),
      progress_value: sign === 'BB' ? 35 : 100,
      progress_date: sign === 'BB' ? '2026-03-15' : '2025-01-01',
      progress_note: sign === 'BB' ? 'Pembongkaran selesai, pembangunan TPA baru berjalan' : 'Existing baseline TD 2025',
      created_by: 'system', source: 'IMPORT',
    };
  });
}

module.exports = { roadmapTypeSummary, categorySummary, subtypeBreakdown, buildPondok1Buildings };
