# Property Listing MVP (Google Sheets + Apps Script + Cloudflare Worker)

Production-ready MVP untuk marketplace properti Indonesia dengan frontend responsif, API Apps Script, dan edge gateway Cloudflare Worker.

## Recommended Folder Structure

```text
property-mvp/
├─ frontend/
│  ├─ index.html
│  ├─ property.html
│  ├─ admin.html
│  └─ assets/
│     ├─ styles.css
│     ├─ api.js
│     ├─ app.js
│     ├─ detail.js
│     ├─ admin.js
│     └─ dummy-data.js
├─ backend/
│  └─ google-apps-script/
│     └─ Code.gs
├─ infra/
│  └─ cloudflare-worker/
│     ├─ worker.js
│     └─ wrangler.toml.example
├─ data/
│  ├─ properties-seed.csv
│  └─ settings-seed.csv
└─ docs/
   ├─ google-sheets-structure.md
   ├─ deployment-guide.md
   └─ production-hardening.md
```

## Feature Coverage

- **Public website**: hero, featured properties, recent listings, filtering (lokasi/tipe/harga), pagination, property detail + galeri + CTA WhatsApp/telepon.
- **Admin dashboard**: token auth, CRUD property, update branding/settings.
- **API**: REST-style endpoint via Apps Script (`/properties`, `/settings`) dengan validasi & sanitasi input.
- **Edge infra**: Cloudflare Worker routing, CORS handling, GET caching, basic IP rate limit.

## API Endpoints

### Properties
- `GET /api/properties`
- `GET /api/properties?id=<id>`
- `POST /api/properties` (auth)
- `PUT /api/properties` (auth)
- `DELETE /api/properties` (auth)

### Settings
- `GET /api/settings`
- `PUT /api/settings` (auth)

## Dummy Data

- 12 listing properti realistis (rumah/apartemen/ruko/tanah/villa) di Jakarta, Tangerang, Bekasi, Bandung, Surabaya, Bali.
- File seed:
  - `data/properties-seed.csv`
  - `data/settings-seed.csv`

## Deployment

Ikuti panduan lengkap di:

- `docs/deployment-guide.md`
- `docs/google-sheets-structure.md`
- `docs/production-hardening.md`

## Quick Security Notes

- Set `ADMIN_API_TOKEN` di Script Properties Apps Script.
- Set Worker secrets: `ADMIN_TOKEN`, `GAS_ADMIN_TOKEN`.
- Batasi `ALLOWED_ORIGIN` ke domain frontend resmi.
- Pastikan endpoint mutasi tidak dicache.
