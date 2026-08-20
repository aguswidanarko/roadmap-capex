# Roadmap CAPEX Bangunan

Implementasi awal dari dua BRD:

- `BRD_Roadmap_CAPEX_Dashboard.pdf` → **web-dashboard** (Web Admin Portal)
- `BRD_Roadmap_CAPEX_Mobile.pdf` → **mobile-app** (Mobile Offline, dibangun sebagai PWA — lihat catatan di bawah)

Keduanya berbagi satu **backend API** (`backend/`) dan di-seed dengan data contoh dari `Roadmap_KAL_New.pdf`
(fixture PT. XXX: Existing TD 2025 = 361, total program 2026–2030 = 56, estimasi 2030 = 417, ditambah detail
63 unit lokasi "Pondok 1" — Kebun KAL, Rayon A, Afd II, Blok B44B/B45B).

## Struktur Project

```
capex-roadmap/
├── backend/          Express + SQLite API (auth, buildings, roadmap, master import, sync, reports)
├── web-dashboard/     React (Vite) — Dashboard Web untuk Admin/Viewer/Operator/Super Admin
└── mobile-app/        React (Vite) PWA — aplikasi lapangan offline-first
```

## Menjalankan (development)

Butuh Node.js 18+.

```bash
# 1. Backend (port 4000) — otomatis membuat & mengisi database SQLite saat pertama kali dijalankan
cd backend
npm install
npm start

# 2. Web Dashboard (port 5173), di terminal terpisah
cd web-dashboard
npm install
npm run dev

# 3. Mobile App / PWA (port 5174), di terminal terpisah
cd mobile-app
npm install
npm run dev
```

Buka `http://localhost:5173` untuk Dashboard Web dan `http://localhost:5174` untuk Mobile App (gunakan
Chrome DevTools device toolbar / buka dari HP di jaringan yang sama untuk pengalaman mobile yang sebenarnya).

### Akun demo (lihat BRD section 4 — Role & Permission)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin (CRUD penuh) |
| operator | operator123 | Operator (mobile + review sync) |
| viewer | viewer123 | Viewer/Management (read only) |
| superadmin | super123 | Super Admin (user & role, global) |

## Yang sudah diimplementasikan

**Backend** — sesuai kontrak API di BRD Dashboard section 18:
`POST /auth/login`, `GET/POST/PUT/DELETE /buildings`, `POST /progress`, `POST /photos`,
`POST /sync/batch`, `GET /sync/status`, `GET /roadmap/summary`, `GET /roadmap/detail`,
`POST /master/import` (+ preview & commit terpisah, sesuai BRD section 11), `GET /reports/*`
(Excel via ExcelJS, PDF via PDFKit), `GET /audit-log`, `GET/POST /users`. Audit trail mencatat
user, timestamp, old/new value, dan source (WEB/MOBILE/IMPORT) untuk tiap perubahan (BRD section 16).

**Web Dashboard** — Dashboard Home (KPI, roadmap by type, category summary, map snapshot, alert),
Roadmap (rekap per jenis + detail per subjenis), Bangunan (list, filter, CRUD untuk Admin), Peta
(Leaflet, marker berwarna per kategori, filter kategori), Foto, Master Data (upload XLSX/CSV dengan
preview validasi: valid/invalid/duplicate + error report), Sync Center (queue real-time, retry),
Reports (export Excel & PDF), Audit Log, User & Role (Super Admin).

**Mobile App** — login dengan sesi tersimpan lokal, Home (summary KPI, dari cache jika offline),
Data Bangunan (list + filter kategori, badge status sync), form Tambah/Edit Bangunan (kategori
BN/EX/AF/BR/BB dengan warna sesuai BRD, capture GPS otomatis, ambil foto dari kamera, roadmap
tahun, progress slider), Peta lokal, **Sync Center** (antrean Pending/Success/Failed/Conflict,
retry manual, auto-sync saat online kembali + saat koneksi pulih), Settings.

### Kenapa Mobile dibangun sebagai PWA, bukan native Android/iOS?

BRD Mobile meminta aplikasi native offline-first. Di lingkungan ini kami tidak bisa mem-build/menjalankan
proyek native (Android Studio / Xcode) untuk Anda coba langsung. Sebagai gantinya, mobile app dibangun
sebagai **PWA offline-first yang sepenuhnya berjalan dan bisa langsung dicoba**: data tersimpan di
IndexedDB (Dexie) sebelum ada koneksi, GPS & kamera memakai Web API browser, dan ada sync-queue dengan
retry/backoff — arsitektur dan alur datanya sama persis dengan yang diminta BRD, hanya lapisan native
UI-nya berbeda. Ini sudah diuji end-to-end: input dilakukan dalam kondisi offline, tersimpan lokal berstatus
"Pending", lalu ter-upload otomatis begitu online lagi. Jika Anda ingin versi native (React Native/Flutter/
Kotlin), struktur data dan API di atas bisa dipakai langsung — port ke native adalah pekerjaan lanjutan
yang berbeda scope dari sesi ini.

## Assumption / Open Decisions (dari BRD section 20 & 16)

BRD secara eksplisit menandai beberapa hal sebagai keputusan bisnis yang belum final. Untuk membuat
aplikasi ini berjalan, kami mengambil pilihan berikut — **harus dikonfirmasi ulang sebelum production**:

- **Definisi Progress %**: dihitung sebagai `unit dengan progress_value ≥ 100% / total unit berkategori BN/AF/BR/BB` (bukan EX, karena EX dianggap sudah selesai secara default).
- **Multi-company**: skema saat ini single-tenant (satu PT per deployment), sesuai contoh PT. XXX.
- **Hierarki lokasi**: PT → Kebun → Rayon → Afdeling → Blok, sesuai contoh sumber.
- **Role mobile**: Field User/Operator boleh input & edit bangunan (tidak dibatasi hanya Admin), mengikuti BRD Mobile MOB-005; Admin dashboard yang mengelola master data.
- **Approval workflow**: belum diimplementasikan (BRD menandainya "Could/opsional").
- **Konflik sync**: pakai `base_updated_at` (version check) — jika record di server berubah sejak device terakhir mengambilnya, status jadi `Conflict` dan butuh resolusi manual di Sync Center (bukan overwrite otomatis).
- **Retensi foto & object storage**: demo ini menyimpan foto sebagai data URL langsung di database (cukup untuk prototipe); untuk production sebaiknya pindah ke object storage (S3-compatible) dengan foto di-upload terpisah dari metadata seperti disyaratkan BRD.
- **Map provider**: OpenStreetMap tiles (gratis, tanpa API key) — ganti sesuai kebutuhan lisensi/offline tiles di production.

## Fixture data

Data contoh diambil dari `Roadmap_KAL_New.pdf` yang Anda lampirkan: rollup 21 jenis bangunan PT. XXX
(existing 361 → estimasi 2030: 417) dan detail 63 unit di lokasi "Pondok 1". Angka-angka ini dipakai
sebagai regression fixture — cocok dengan Acceptance Criteria #3 di BRD Dashboard ("Angka fixture PT. XXX
menghasilkan existing 361, total program 56, estimasi 2030 417").
