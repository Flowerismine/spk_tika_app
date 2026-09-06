# Panduan Deploy SPK Naive Bayes

## Struktur Proyek
```
spk-naive-bayes/
├── backend/    → Deploy ke Render
└── frontend/   → Deploy ke Vercel
```

## Langkah Deploy

### 1. Upload ke GitHub
- Buat repository baru di GitHub
- Upload folder ini

### 2. Database — Clever Cloud (MySQL gratis)
1. Daftar di https://clever-cloud.com
2. Buat MySQL addon
3. Catat: host, port, username, password, database name
4. Buat tabel dengan menjalankan Sequelize sync (otomatis saat backend start)

### 3. Backend — Render
1. Daftar di https://render.com
2. New → Web Service → connect GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Tambah Environment Variables:
   - `DB_URL` = mysql://user:pass@host:port/dbname
   - `FRONTEND_URL` = https://nama-app.vercel.app (isi setelah deploy frontend)
   - `SESS_SECRET` = (salin dari .env)
   - `JWT_SECRET_ADMIN` = (salin dari .env)
   - `ACCESS_TOKEN_SECRET` = (salin dari .env)
   - `REFRESH_TOKEN_SECRET` = (salin dari .env)
   - `NODE_ENV` = production
7. Deploy → catat URL backend (contoh: https://spk-backend.onrender.com)

### 4. Frontend — Vercel
1. Daftar di https://vercel.com
2. New Project → Import GitHub repo
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Tambah Environment Variable:
   - `REACT_APP_API_URL` = URL backend dari Render (langkah 3)
6. Deploy

### 5. Update CORS Backend
- Kembali ke Render → Environment Variables
- Update `FRONTEND_URL` = URL Vercel yang didapat dari langkah 4
- Redeploy backend

### 6. Seed Data (opsional)
- Buka URL: https://nama-app.vercel.app/seeder
- Login sebagai admin
- Klik "Jalankan Seed Data"
