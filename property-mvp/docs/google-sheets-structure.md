# Google Sheets Structure

## Sheet 1: `Properties`

Gunakan baris pertama sebagai header persis seperti urutan berikut:

1. `id`
2. `title`
3. `slug`
4. `price`
5. `location`
6. `address`
7. `property_type`
8. `bedrooms`
9. `bathrooms`
10. `land_size`
11. `building_size`
12. `status`
13. `description`
14. `image_url`
15. `gallery_urls`
16. `contact_name`
17. `contact_phone`
18. `featured`
19. `created_at`
20. `updated_at`

> `gallery_urls` direkomendasikan dipisahkan dengan karakter `|` (pipe).

## Sheet 2: `Settings`

Header:

1. `key`
2. `value`

Contoh key yang dipakai frontend:

- `company_name`
- `logo_url`
- `theme_color`
- `whatsapp_contact`
- `phone_number`
- `email`
- `office_address`
- `hero_title`
- `hero_subtitle`

## Cara Isi Seed Data

1. Buka Google Spreadsheet yang dipakai Apps Script.
2. Buat sheet bernama `Properties` dan `Settings`.
3. Import file:
   - `property-mvp/data/properties-seed.csv`
   - `property-mvp/data/settings-seed.csv`
4. Pastikan format angka `price`, `land_size`, `building_size` tidak berubah jadi teks berformat mata uang.
5. Pastikan baris header tidak berubah urutannya.
