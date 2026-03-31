# Deployment Guide (MVP Production Path)

## 1) Deploy Google Apps Script API

1. Masuk ke Google Apps Script dan buat project baru.
2. Tempel isi `property-mvp/backend/google-apps-script/Code.gs`.
3. Hubungkan ke Google Sheet target (pastikan sheet `Properties` dan `Settings` tersedia).
4. Import seed data dari:
   - `property-mvp/data/properties-seed.csv`
   - `property-mvp/data/settings-seed.csv`
5. Set **Script Property**:
   - `ADMIN_API_TOKEN` = token admin rahasia panjang.
6. Deploy:
   - **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (disarankan hanya diakses via Worker + token)
7. Simpan URL web app, contoh:
   - `https://script.google.com/macros/s/XXX/exec`

## 2) Deploy Cloudflare Worker (API Gateway)

1. Masuk ke folder Worker:
   - `property-mvp/infra/cloudflare-worker`
2. Copy `wrangler.toml.example` menjadi `wrangler.toml`.
3. Isi variabel di `wrangler.toml`:
   - `GAS_WEB_APP_URL`
   - `ALLOWED_ORIGIN`
   - `CACHE_TTL_SECONDS`
4. Set secrets:
   - `wrangler secret put ADMIN_TOKEN`
   - `wrangler secret put GAS_ADMIN_TOKEN`
5. Deploy:
   - `wrangler deploy`
6. Endpoint worker Anda akan melayani:
   - `GET /api/properties`
   - `GET /api/properties?id=...`
   - `POST /api/properties`
   - `PUT /api/properties`
   - `DELETE /api/properties`
   - `GET /api/settings`
   - `PUT /api/settings`

## 3) Deploy Frontend

Opsi mudah:

- Cloudflare Pages
- Netlify
- Vercel

Gunakan folder `property-mvp/frontend` sebagai publish directory.

Pastikan domain frontend diizinkan oleh `ALLOWED_ORIGIN` pada Worker.

## 4) Smoke Test Setelah Deploy

1. Cek public API:
   - `GET /api/settings`
   - `GET /api/properties?page=1&limit=6`
2. Cek filter:
   - `GET /api/properties?location=Jakarta&property_type=rumah`
3. Cek auth admin:
   - Coba `POST /api/properties` tanpa bearer token → harus 401.
   - Coba dengan token benar → harus berhasil.
4. Cek frontend:
   - Homepage menampilkan hero + featured + listing + pagination.
   - Detail page bisa tampil via `property.html?id=<id>`.
   - Dashboard admin bisa CRUD + update settings.

## 5) Operational Notes

- Semua write endpoint melalui Worker agar token tidak terekspos langsung.
- Jangan commit token ke repository.
- Atur monitoring Worker dan error rate Apps Script.
