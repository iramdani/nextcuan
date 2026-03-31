import { apiGetPropertyById, apiGetSettings, formatIDR, toWhatsAppLink } from './api.js';
import { DUMMY_PROPERTIES, DUMMY_SETTINGS } from './dummy-data.js';

const detailMessage = document.getElementById('detailMessage');
const detailLayout = document.getElementById('detailLayout');

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseGallery(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return String(value || '')
    .split(/[|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyBranding(settings) {
  const safe = { ...DUMMY_SETTINGS, ...settings };
  document.documentElement.style.setProperty('--theme-color', safe.theme_color || '#0f766e');
  document.getElementById('brandName').textContent = safe.company_name || DUMMY_SETTINGS.company_name;
  document.getElementById('footerBrand').textContent = safe.company_name || DUMMY_SETTINGS.company_name;
  document.getElementById('footerAddress').textContent = safe.office_address || DUMMY_SETTINGS.office_address;
  document.getElementById('footerPhone').textContent = safe.phone_number || DUMMY_SETTINGS.phone_number;
  document.getElementById('footerEmail').textContent = safe.email || DUMMY_SETTINGS.email;
  if (safe.logo_url) {
    document.getElementById('brandLogo').src = safe.logo_url;
  }
}

function renderProperty(property) {
  const image = property.image_url || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80';
  const gallery = parseGallery(property.gallery_urls);
  const galleryNodes = gallery
    .map((url) => `<img loading="lazy" src="${escapeHtml(url)}" alt="Galeri ${escapeHtml(property.title)}" />`)
    .join('');

  const waLink = toWhatsAppLink(property.contact_phone, property.title);
  const callLink = `tel:${String(property.contact_phone || '').replace(/[^\d+]/g, '')}`;

  detailLayout.innerHTML = `
    <article class="panel">
      <div class="detail-main-image">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(property.title)}" />
      </div>
      <div class="gallery-grid">${galleryNodes}</div>
      <h2 style="margin-bottom:.4rem;">${escapeHtml(property.title)}</h2>
      <p class="price">${formatIDR(property.price)}</p>
      <p class="location">📍 ${escapeHtml(property.location)} · ${escapeHtml(property.address)}</p>
      <p class="description" style="margin-top:.8rem;">${escapeHtml(property.description)}</p>

      <div class="meta-list">
        <div class="meta-item"><p>Tipe Properti</p><strong>${escapeHtml(property.property_type)}</strong></div>
        <div class="meta-item"><p>Status</p><strong>${escapeHtml(property.status)}</strong></div>
        <div class="meta-item"><p>Kamar Tidur</p><strong>${escapeHtml(property.bedrooms || 0)}</strong></div>
        <div class="meta-item"><p>Kamar Mandi</p><strong>${escapeHtml(property.bathrooms || 0)}</strong></div>
        <div class="meta-item"><p>Luas Tanah</p><strong>${escapeHtml(property.land_size || 0)} m²</strong></div>
        <div class="meta-item"><p>Luas Bangunan</p><strong>${escapeHtml(property.building_size || 0)} m²</strong></div>
      </div>
    </article>

    <aside class="panel">
      <h3 style="margin-top:0;">Hubungi Agen</h3>
      <p class="muted" style="margin-top:0;">Kami siap bantu jadwalkan survei lokasi dan negosiasi terbaik.</p>
      <p><strong>${escapeHtml(property.contact_name || '-')}</strong></p>
      <p class="muted">${escapeHtml(property.contact_phone || '-')}</p>
      <div class="form-grid">
        <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener">Chat via WhatsApp</a>
        <a class="btn btn-secondary" href="${callLink}">Telepon Sekarang</a>
      </div>
    </aside>
  `;

  detailMessage.classList.add('hidden');
  detailLayout.classList.remove('hidden');
}

function showError(message) {
  detailMessage.className = 'alert error';
  detailMessage.textContent = message;
  detailLayout.classList.add('hidden');
}

async function loadSettings() {
  try {
    const response = await apiGetSettings();
    applyBranding(response.data?.settings || response.data || DUMMY_SETTINGS);
  } catch (error) {
    applyBranding(DUMMY_SETTINGS);
  }
}

async function loadProperty() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError('ID properti tidak ditemukan. Kembali ke halaman listing untuk memilih properti.');
    return;
  }

  try {
    const response = await apiGetPropertyById(id);
    const property = response.data?.item || response.data;
    if (!property) {
      throw new Error('Properti tidak tersedia');
    }
    renderProperty(property);
  } catch (error) {
    const fallback = DUMMY_PROPERTIES.find((item) => item.id === id);
    if (fallback) {
      renderProperty(fallback);
      return;
    }
    showError('Detail properti tidak dapat dimuat saat ini. Silakan coba beberapa saat lagi.');
  }
}

async function init() {
  await Promise.all([loadSettings(), loadProperty()]);
}

init();
