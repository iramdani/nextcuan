# Production Hardening Notes

## 1) Authentication & Secret Management

- Set `ADMIN_API_TOKEN` in Google Apps Script Script Properties.
- Set `ADMIN_TOKEN` and `GAS_ADMIN_TOKEN` as Cloudflare Worker secrets.
- Gunakan token berbeda untuk environment dev/staging/prod.
- Jangan simpan token admin di localStorage. Dashboard ini memakai `sessionStorage` agar token tidak persisten lintas sesi browser.

## 2) Endpoint Exposure Control

- Arahkan semua trafik API publik ke Cloudflare Worker (`/api/*`).
- Hindari mengekspos URL Google Apps Script (`/exec`) di frontend.
- Batasi `ALLOWED_ORIGIN` ke domain resmi frontend.

## 3) Input Validation & Abuse Prevention

- Backend memvalidasi enum (`property_type`, `status`), URL, email, nomor telepon, angka, dan payload size.
- Semua input teks disanitasi dari control character + tag HTML.
- Formula injection prevention di Google Sheets: nilai yang diawali `= + - @` diprefix `'`.
- Worker menolak body non-JSON untuk endpoint mutasi dan membatasi ukuran body.

## 4) Caching & Rate Limiting

- Cache hanya untuk `GET /api/properties` dan `GET /api/settings`.
- Mutation endpoints (`POST/PUT/DELETE`) **tidak** dicache.
- Rate limiting IP-based baseline sudah tersedia di Worker.
- Untuk production volume tinggi, migrasi ke managed rate limiting binding / KV / Durable Objects agar konsisten lintas isolate.

## 5) Reliability & Quotas

- Apps Script memiliki quota harian. Gunakan batch operation pada baca/tulis sheet.
- Pakai `LockService` di semua operasi write untuk mencegah race condition.
- Pasang alert monitoring untuk 5xx dan lonjakan 429.

## 6) Observability

- Tambahkan log minimal: method, route, status code, latency.
- Buat dashboard metrik sederhana: request count, cache hit ratio, 401/429/5xx.

## 7) Recommended Next Steps

1. Tambahkan request ID (`X-Request-ID`) untuk trace lintas frontend → worker → GAS.
2. Tambahkan audit trail sheet untuk perubahan admin (create/update/delete).
3. Implementasi WAF rules Cloudflare (bot score, geo rules jika perlu).
4. Tambahkan backup otomatis Google Sheets (harian).
