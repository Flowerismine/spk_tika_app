# Panduan Deploy SPK Naive Bayes — Vercel (Monorepo, Full Serverless)

## Struktur Proyek
```
spk-naive-bayes/
├── vercel.json           → routing: /api/* → backend, sisanya → frontend build
├── backend/               → jadi Vercel Serverless Function (via backend/functions/api.js)
└── frontend/               → di-build sebagai static site (React/CRA)
```

Satu project Vercel meng-handle frontend dan backend sekaligus, satu domain.

## Langkah Deploy

### 1. Upload ke GitHub
- Push seluruh folder ini (termasuk `vercel.json` di root) ke satu repository.

### 2. Database — MySQL (Clever Cloud, Railway, PlanetScale, dll)
1. Siapkan MySQL yang bisa diakses dari luar (public host + port), karena Vercel Functions perlu koneksi keluar ke DB.
2. Catat connection string lengkap: `mysql://user:pass@host:port/dbname`.
3. **Penting**: pastikan provider MySQL kamu mengizinkan cukup banyak koneksi bersamaan. Backend sudah di-patch untuk cache koneksi (pool kecil per container), tapi tetap ada risiko banyak koneksi kalau traffic tinggi — ini batasan bawaan pola serverless + database relasional tradisional.

### 3. Import Project di Vercel
1. Daftar/login di https://vercel.com
2. New Project → Import repo GitHub ini
3. Vercel akan otomatis mendeteksi `vercel.json` di root — **jangan** override build settings manual, biarkan `vercel.json` yang mengatur.
4. Tambahkan Environment Variables (Settings → Environment Variables), berlaku untuk Production (dan Preview jika perlu):
   - `DB_URL` = mysql://user:pass@host:port/dbname
   - `JWT_SECRET_ADMIN` = (isi string acak yang aman)
   - `NODE_ENV` = production
   - `FRONTEND_URL` = https://nama-project-kamu.vercel.app (isi setelah tahu domain final; boleh update lalu redeploy)
5. Deploy.

### 4. Setelah Deploy Pertama
- Cek domain yang diberikan Vercel, lalu pastikan `FRONTEND_URL` di Environment Variables sudah sesuai domain itu (untuk CORS). Kalau baru diisi/diubah, klik **Redeploy**.
- Frontend otomatis memanggil backend lewat path relatif `/api/...` (satu domain, tidak perlu env `REACT_APP_API_URL` lagi).

### 5. Seed Data (opsional)
- Buka `https://nama-project-kamu.vercel.app/seeder`
- Login sebagai admin
- Klik "Jalankan Seed Data"

### Catatan Migrasi dari Netlify/Render
- `frontend/src/api.js` sudah diarahkan ke `/api` (bukan `/.netlify/functions/api`).
- `backend/config/database.js` sudah pakai connection caching (`global.__sequelizeInstance`) supaya tidak bikin koneksi MySQL baru tiap cold start.
- `backend/index.js` sudah di-guard supaya `db.sync()` cuma jalan sekali per container, bukan di tiap request/cold start.
- File `netlify.toml` tidak lagi dipakai — boleh dihapus atau dibiarkan (tidak akan terbaca oleh Vercel).
