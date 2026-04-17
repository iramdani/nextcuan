/**
 * ============================================
 * SITE CONFIGURATION — Edit this file only!
 * ============================================
 *
 * Untuk deploy ke domain baru, ubah nilai di bawah ini.
 * Tidak perlu mengedit file lain.
 *
 * Format domain: tanpa protokol (https://), tanpa trailing slash (/)
 * Contoh: 'mydomain.com', bukan 'https://mydomain.com/'
 */
var SITE_CONFIG = {
    // ── Domain Utama (Production) ──────────────────────────
    PRIMARY_DOMAIN: 'nextcuan.my.id',

    // ── Daftar Domain yang Diizinkan ───────────────────────
    ALLOWED_DOMAINS: [
        'nextcuan.my.id',
        'www.nextcuan.my.id',
        'akses.nextcuan.my.id',
        'www.akses.nextcuan.my.id'
    ],

    // ── Pattern Subdomain yang Diizinkan ───────────────────
    ALLOWED_SUBDOMAIN_SUFFIXES: [
        '.nextcuan.my.id',
        '.akses.nextcuan.my.id'
    ],

    // ── Cloudflare Pages Preview ───────────────────────────
    ALLOW_PAGES_DEV: true,

    // ── Local Development ──────────────────────────────────
    ALLOW_LOCALHOST: true
};
