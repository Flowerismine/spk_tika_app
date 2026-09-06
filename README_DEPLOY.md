# Panduan Deploy SPK Naive Bayes — Vercel Services (Monorepo)

## Struktur Proyek
```
spk-naive-bayes/
├── vercel.json      → definisi service frontend & backend + rewrite routing
├── backend/          → Web Service Express (proses long-running, listen di PORT)
└── frontend/          → Web Service Create React App (static build)
```

Satu project Vercel, satu domain. Vercel membangun `frontend` dan `backend`
sebagai dua service terpisah lalu meneruskan trafik sesuai `rewrites` di
`vercel.json`: request ke `/api/*` masuk ke service `backend`, sisanya ke
service `frontend`.

Backend berjalan sebagai **Web Service** biasa (mirip kalau di-deploy ke
Render) — bukan serverless function per-request. Artinya koneksi database
dibuka sekali saat proses start dan dipakai terus selama proses hidup, bukan
dibuka-tutup tiap request.

## Langkah Deploy

### 1. Upload ke GitHub
- Push seluruh folder ini (termasuk `vercel.json` di root) ke satu repository.

### 2. Database — MySQL (Clever Cloud, Railway, PlanetScale, dll)
1. Siapkan MySQL yang bisa diakses dari luar (public host + port).
2. Catat connection string lengkap: `mysql://user:pass@host:port/dbname`.
3. Kalau pakai paket gratis/shared (mis. Clever Cloud "DEV"), connection
   limit-nya kecil. Karena backend di sini cuma satu proses (bukan banyak
   instance serverless), risiko kehabisan koneksi jauh lebih kecil
   dibanding pola serverless — tapi tetap ada batas wajar dari sisi trafik.

### 3. Import Project di Vercel
1. Daftar/login di https://vercel.com
2. New Project → Import repo GitHub ini
3. Vercel akan mendeteksi struktur monorepo dan menawarkan generate
   `vercel.json` dengan skema **Services** — pastikan `frontend` terdeteksi
   sebagai Create React App dan `backend` sebagai Express/Web Service dengan
   path `/api`. Kalau `vercel.json` sudah ada di repo (seperti project ini),
   Vercel langsung memakainya.
4. Tambahkan Environment Variables (Settings → Environment Variables),
   berlaku untuk Production (dan Preview jika perlu):
   - `DB_URL` = mysql://user:pass@host:port/dbname
   - `JWT_SECRET_ADMIN` = (isi string acak yang aman)
   - `NODE_ENV` = production
   - `FRONTEND_URL` = https://nama-project-kamu.vercel.app (isi setelah tahu
     domain final; boleh update lalu redeploy)
5. Deploy.

### 4. Setelah Deploy Pertama
- Cek domain yang diberikan Vercel, lalu pastikan `FRONTEND_URL` di
  Environment Variables sudah sesuai domain itu (untuk CORS). Kalau baru
  diisi/diubah, klik **Redeploy**.
- Frontend otomatis memanggil backend lewat path relatif `/api/...` (satu
  domain, tidak perlu env `REACT_APP_API_URL` lagi).

### 5. Seed Data (opsional)
- Buka `https://nama-project-kamu.vercel.app/seeder`
- Login sebagai admin
- Klik "Jalankan Seed Data"

### Catatan Migrasi dari Netlify/Render
- `frontend/src/api.js` sudah diarahkan ke `/api` (bukan
  `/.netlify/functions/api`).
- `backend/index.js` selalu memanggil `app.listen()` dan membaca port dari
  `process.env.PORT` (disuntikkan otomatis oleh Vercel Services) dengan
  fallback ke `APP_PORT`/5000 untuk development lokal.
- `backend/config/database.js` memakai pool koneksi kecil (`max: 3`) yang
  wajar untuk satu proses Web Service — tidak perlu pola caching agresif ala
  serverless.
- `backend/functions/api.js` (wrapper `serverless-http`) dan `netlify.toml`
  sudah dihapus karena tidak relevan lagi di skema Vercel Services.
