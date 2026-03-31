import { apiGetProperties, apiGetSettings, APP_CONFIG, formatIDR } from './api.js';
import { DUMMY_PROPERTIES, DUMMY_SETTINGS } from './dummy-data.js';

const state = {
  listings: [],
  featured: [],
  fallbackMode: false,
  pageSize: APP_CONFIG.PAGE_SIZE || 6,
  pagination: {
    page: 1,
    limit: APP_CONFIG.PAGE_SIZE || 6,
    total_items: 0,
    total_pages: 1
  }
};

const elements = {
  brandName: document.getElementById('brandName'),
  brandLogo: document.getElementById('brandLogo'),
  heroTitle: document.getElementById('heroTitle'),
  heroSubtitle: document.getElementById('heroSubtitle'),
  footerBrand: document.getElementById('footerBrand'),
  footerAddress: document.getElementById('footerAddress'),
  footerPhone: document.getElementById('footerPhone'),
  footerEmail: document.getElementById('footerEmail'),
  filterForm: document.getElementById('filterForm'),
  locationFilter: document.getElementById('locationFilter'),
  typeFilter: document.getElementById('typeFilter'),
  minPriceFilter: document.getElementById('minPriceFilter'),
  maxPriceFilter: document.getElementById('maxPriceFilter'),
  resetFilterBtn: document.getElementById('resetFilterBtn'),
  featuredGrid: document.getElementById('featuredGrid'),
  listingGrid: document.getElementById('listingGrid'),
  resultCount: document.getElementById('resultCount'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageIndicator: document.getElementById('pageIndicator')
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeProperty(property) {
  return {
    ...property,
    price: Number(property.price || 0),
    bedrooms: Number(property.bedrooms || 0),
    bathrooms: Number(property.bathrooms || 0),
    land_size: Number(property.land_size || 0),
    building_size: Number(property.building_size || 0),
    featured: property.featured === true || String(property.featured).toLowerCase() === 'true'
  };
}

function parseGallery(gallery) {
  if (Array.isArray(gallery)) {
    return gallery;
  }
  return String(gallery || '')
    .split(/[|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyBranding(settings) {
  const merged = { ...DUMMY_SETTINGS, ...settings };
  document.documentElement.style.setProperty('--theme-color', merged.theme_color || '#0f766e');
  elements.brandName.textContent = merged.company_name || DUMMY_SETTINGS.company_name;
  elements.footerBrand.textContent = merged.company_name || DUMMY_SETTINGS.company_name;
  elements.heroTitle.textContent = merged.hero_title || DUMMY_SETTINGS.hero_title;
  elements.heroSubtitle.textContent = merged.hero_subtitle || DUMMY_SETTINGS.hero_subtitle;
  elements.footerAddress.textContent = merged.office_address || DUMMY_SETTINGS.office_address;
  elements.footerPhone.textContent = merged.phone_number || DUMMY_SETTINGS.phone_number;
  elements.footerEmail.textContent = merged.email || DUMMY_SETTINGS.email;

  if (merged.logo_url) {
    elements.brandLogo.src = merged.logo_url;
    elements.brandLogo.onerror = () => {
      elements.brandLogo.src = DUMMY_SETTINGS.logo_url;
    };
  }
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'booking' || normalized === 'sold') {
    return normalized;
  }
  return 'available';
}

function createPropertyCard(property) {
  const summary = property.description?.length > 120
    ? `${property.description.slice(0, 120)}...`
    : property.description;
  const gallery = parseGallery(property.gallery_urls);
  const image = property.image_url || gallery[0] || DUMMY_PROPERTIES[0].image_url;
  const statusClass = getStatusClass(property.status);

  return `
    <article class="property-card">
      <figure>
        <img loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(property.title)}" onerror="this.src='${DUMMY_PROPERTIES[0].image_url}'" />
      </figure>
      <div class="body">
        <div class="card-top">
          <span class="property-type">${escapeHtml(property.property_type)}</span>
          <span class="status ${statusClass}">${escapeHtml(property.status)}</span>
        </div>
        <h3 style="margin:0;">${escapeHtml(property.title)}</h3>
        <p class="price">${formatIDR(property.price)}</p>
        <p class="location">📍 ${escapeHtml(property.location)}</p>
        <p class="description">${escapeHtml(summary || '')}</p>
        <div class="card-actions">
          <a class="btn btn-primary" href="./property.html?id=${encodeURIComponent(property.id)}">Lihat Detail</a>
        </div>
      </div>
    </article>
  `;
}

function showFallbackNotice() {
  const existing = document.getElementById('fallbackNotice');
  if (existing) {
    existing.remove();
  }

  if (!state.fallbackMode) {
    return;
  }

  const notice = document.createElement('div');
  notice.id = 'fallbackNotice';
  notice.className = 'container';
  notice.innerHTML = '<div class="alert" style="margin-top:1rem;">Mode demo aktif: data saat ini menggunakan seed lokal karena API belum terhubung.</div>';
  const main = document.querySelector('main');
  main.insertBefore(notice, main.firstChild.nextSibling);
}

function renderFeaturedCards() {
  if (!state.featured.length) {
    elements.featuredGrid.innerHTML = '<div class="empty">Belum ada properti unggulan.</div>';
    return;
  }
  elements.featuredGrid.innerHTML = state.featured.map((property) => createPropertyCard(property)).join('');
}

function renderListings() {
  if (!state.listings.length) {
    elements.listingGrid.innerHTML = '<div class="empty">Tidak ada listing yang cocok dengan filter Anda.</div>';
  } else {
    elements.listingGrid.innerHTML = state.listings.map((property) => createPropertyCard(property)).join('');
  }

  const pagination = state.pagination;
  elements.resultCount.textContent = `${pagination.total_items} properti ditemukan`;
  elements.pageIndicator.textContent = `Halaman ${pagination.page} dari ${pagination.total_pages}`;
  elements.prevPageBtn.disabled = pagination.page <= 1;
  elements.nextPageBtn.disabled = pagination.page >= pagination.total_pages;
}

function getFiltersFromForm() {
  return {
    location: elements.locationFilter.value.trim(),
    property_type: elements.typeFilter.value.trim(),
    min_price: elements.minPriceFilter.value.trim(),
    max_price: elements.maxPriceFilter.value.trim()
  };
}

function applyFallbackFiltersAndPagination(page) {
  const filters = getFiltersFromForm();
  const minPrice = Number(filters.min_price || 0);
  const maxPrice = Number(filters.max_price || Number.MAX_SAFE_INTEGER);

  const filtered = DUMMY_PROPERTIES
    .map(normalizeProperty)
    .filter((item) => {
      const locationMatch = !filters.location || String(item.location).toLowerCase().includes(filters.location.toLowerCase());
      const typeMatch = !filters.property_type || String(item.property_type).toLowerCase() === filters.property_type.toLowerCase();
      const price = Number(item.price || 0);
      const priceMatch = price >= minPrice && price <= maxPrice;
      return locationMatch && typeMatch && priceMatch;
    });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * state.pageSize;

  state.listings = filtered.slice(offset, offset + state.pageSize);
  state.featured = filtered.filter((item) => item.featured).slice(0, 4);
  state.pagination = {
    page: safePage,
    limit: state.pageSize,
    total_items: totalItems,
    total_pages: totalPages
  };
}

async function loadProperties(page = 1) {
  const filters = getFiltersFromForm();
  try {
    const response = await apiGetProperties({
      page,
      limit: state.pageSize,
      location: filters.location,
      property_type: filters.property_type,
      min_price: filters.min_price,
      max_price: filters.max_price
    });

    const data = response.data || {};
    state.listings = (data.items || []).map(normalizeProperty);
    state.pagination = {
      page: Number(data.pagination?.page || page),
      limit: Number(data.pagination?.limit || state.pageSize),
      total_items: Number(data.pagination?.total_items || state.listings.length),
      total_pages: Number(data.pagination?.total_pages || 1)
    };

    const featuredResponse = await apiGetProperties({ featured: true, limit: 4, page: 1 });
    state.featured = ((featuredResponse.data && featuredResponse.data.items) || []).map(normalizeProperty);
    state.fallbackMode = false;
  } catch (error) {
    state.fallbackMode = true;
    applyFallbackFiltersAndPagination(page);
    console.warn('API tidak tersedia. Menggunakan fallback data lokal.', error);
  }

  showFallbackNotice();
  renderFeaturedCards();
  renderListings();
}

function buildLocationFilterOptions(source) {
  const uniqueLocations = [...new Set(source.map((item) => item.location).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'id'));
  const options = ['<option value="">Semua Lokasi</option>'];
  uniqueLocations.forEach((location) => {
    options.push(`<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`);
  });
  elements.locationFilter.innerHTML = options.join('');
}

async function loadSettings() {
  try {
    const response = await apiGetSettings();
    applyBranding(response.data?.settings || response.data || DUMMY_SETTINGS);
  } catch (error) {
    applyBranding(DUMMY_SETTINGS);
    state.fallbackMode = true;
    showFallbackNotice();
  }
}

function setupEvents() {
  elements.filterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadProperties(1);
  });

  elements.resetFilterBtn.addEventListener('click', async () => {
    elements.filterForm.reset();
    await loadProperties(1);
  });

  elements.prevPageBtn.addEventListener('click', async () => {
    const targetPage = Math.max(1, state.pagination.page - 1);
    await loadProperties(targetPage);
    window.scrollTo({ top: elements.listingGrid.offsetTop - 100, behavior: 'smooth' });
  });

  elements.nextPageBtn.addEventListener('click', async () => {
    const targetPage = Math.min(state.pagination.total_pages, state.pagination.page + 1);
    await loadProperties(targetPage);
    window.scrollTo({ top: elements.listingGrid.offsetTop - 100, behavior: 'smooth' });
  });
}

async function init() {
  setupEvents();
  buildLocationFilterOptions(DUMMY_PROPERTIES);
  await loadSettings();
  await loadProperties(1);
}

init();
