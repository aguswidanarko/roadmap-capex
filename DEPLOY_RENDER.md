# Deploy ke Render.com (gratis, tanpa kartu kredit)

Render butuh kode-nya ada di repository Git (GitHub/GitLab), jadi ada 2 tahap: (1) upload project
ke GitHub, (2) hubungkan ke Render. Total sekitar 10 menit.

File `render.yaml` di root project ini sudah berisi konfigurasi lengkap (build command, start
command, environment variable) — Render akan membacanya otomatis lewat fitur "Blueprint".

---

## Tahap 1 — Upload project ke GitHub

Kalau project ini belum ada di GitHub:

1. Buka [github.com/new](https://github.com/new), buat repository baru (boleh nama apa saja,
   misalnya `capex-roadmap`). Biarkan kosong (jangan centang "Add README").
2. Di komputer Anda, buka terminal di folder hasil extract `capex-roadmap.zip`, lalu jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Roadmap CAPEX Bangunan"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/capex-roadmap.git
   git push -u origin main
   ```
   Ganti `USERNAME_ANDA` dengan username GitHub Anda. Git akan minta login — ikuti saja instruksi
   di layar (biasanya lewat browser).

## Tahap 2 — Deploy di Render

1. Buka [dashboard.render.com](https://dashboard.render.com) → daftar/login (bisa langsung pakai
   akun GitHub, tidak perlu kartu kredit untuk tier gratis).
2. Klik **New +** (pojok kanan atas) → pilih **Blueprint**.
3. Pilih/hubungkan repository `capex-roadmap` yang tadi di-push.
4. Render otomatis mendeteksi `render.yaml` dan menampilkan preview service bernama
   **capex-roadmap** dengan plan **Free**. Klik **Apply** / **Create New Resources**.
5. Tunggu proses build (sekitar 2–4 menit) — bisa dilihat live di tab **Logs**. Anda akan melihat
   proses `npm install`, build Web Dashboard, lalu server mulai jalan.
6. Setelah selesai, Render menampilkan URL publik seperti:
   `https://capex-roadmap.onrender.com`
7. Buka URL tersebut → halaman login Dashboard Web akan muncul. Login dengan akun demo:
   - `admin` / `admin123`
   - `operator` / `operator123`
   - `viewer` / `viewer123`
   - `superadmin` / `super123`

**Selesai** — dashboard sekarang bisa diakses dan dites dari mana saja, tanpa perlu menjalankan
apa pun di komputer Anda.

---

## Kalau tidak pakai fitur Blueprint

Bisa juga tanpa `render.yaml`, dengan New + → **Web Service** manual, lalu isi:

| Field | Isi |
|---|---|
| Build Command | `cd backend && npm install && npm run build:web` |
| Start Command | `cd backend && npm start` |
| Plan | Free |

Lalu tambahkan Environment Variable `JWT_SECRET` dengan nilai bebas (string acak apa saja,
minimal 20 karakter).

---

## Hal yang perlu diketahui (khusus tier gratis)

- **Cold start**: instance gratis "tidur" setelah ~15 menit tanpa aktivitas. Request pertama
  setelah itu bisa lambat (~30–50 detik) sebelum server bangun lagi — ini normal, bukan error.
- **Data ter-reset**: database SQLite disimpan di disk sementara (ephemeral). Setiap kali service
  restart/redeploy, data kembali ke fixture awal (PT. XXX / Pondok 1). Ini justru cocok untuk
  kebutuhan testing berulang kali dengan data bersih — tapi **jangan dipakai untuk data produksi
  sungguhan** tanpa menambahkan disk permanen (fitur berbayar di Render) atau pindah ke database
  eksternal (mis. Postgres).
- **Update kode**: setiap kali Anda `git push` perubahan baru ke branch `main`, Render otomatis
  build & deploy ulang.

## Kalau build gagal

Error yang paling mungkin muncul adalah kegagalan kompilasi `better-sqlite3` (native module).
Kalau itu terjadi, screenshot log error-nya dan kirim ke saya — saya bantu sesuaikan (biasanya
cukup ganti base image atau pin versi Node tertentu).

## Mobile App (PWA)

`render.yaml` ini hanya men-deploy **Web Dashboard**. Kalau nanti Anda ingin Mobile App (PWA) juga
online (misalnya supaya bisa dites dari HP sungguhan), beri tahu saya — saya siapkan service kedua
dengan pola yang sama (build `mobile-app`, arahkan `VITE_API_URL` ke URL backend yang sama).
