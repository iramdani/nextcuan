import {
  apiCreateProperty,
  apiDeleteProperty,
  apiGetProperties,
  apiGetSettings,
  apiUpdateProperty,
  apiUpdateSettings,
  formatIDR
} from './api.js';
import { DUMMY_PROPERTIES, DUMMY_SETTINGS } from './dummy-data.js';

const TOKEN_KEY = 'property_admin_token';

const authPanel = document.getElementById('authPanel');
const authForm = document.getElementById('authForm');
const authMessage = document.getElementById('authMessage');
const dashboardSection = document.getElementById('dashboardSection');
const logoutBtn = document.getElementById('logoutBtn');

const propertyForm = document.getElementById('propertyForm');
const resetPropertyFormBtn = document.getElementById('resetPropertyFormBtn');
const propertyTableBody = document.getElementById('propertyTableBody');
const propertyMessage = document.getElementById('propertyMessage');

const settingsForm = document.getElementById('settingsForm');
const settingsMessage = document.getElementById('settingsMessage');

const state = {
  token: sessionStorage.getItem(TOKEN_KEY) || '',
  properties: [],
  settings: { ...DUMMY_SETTINGS }
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'booking' || normalized === 'sold') {
    return normalized;
  }
  return 'available';
}

function setMessage(element, text, isError = false) {
  element.className = isError ? 'alert error' : 'muted';
  element.textContent = text;
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

function getFormValue(id) {
  return document.getElementById(id).value.trim();
}

function collectPropertyForm() {
  return {
    id: getFormValue('propertyId'),
    title: getFormValue('title'),
    location: getFormValue('location'),
    address: getFormValue('address'),
    property_type: getFormValue('property_type'),
    status: getFormValue('status'),
    price: Number(getFormValue('price') || 0),
    land_size: Number(getFormValue('land_size') || 0),
    building_size: Number(getFormValue('building_size') || 0),
    bedrooms: Number(getFormValue('bedrooms') || 0),
    bathrooms: Number(getFormValue('bathrooms') || 0),
    featured: getFormValue('featured') === 'true',
    image_url: getFormValue('image_url'),
    gallery_urls: getFormValue('gallery_urls'),
    description: getFormValue('description'),
    contact_name: getFormValue('contact_name'),
    contact_phone: getFormValue('contact_phone')
  };
}

function fillPropertyForm(property) {
  document.getElementById('propertyId').value = property.id || '';
  document.getElementById('title').value = property.title || '';
  document.getElementById('location').value = property.location || '';
  document.getElementById('address').value = property.address || '';
  document.getElementById('property_type').value = property.property_type || 'rumah';
  document.getElementById('status').value = property.status || 'available';
  document.getElementById('price').value = property.price || 0;
  document.getElementById('land_size').value = property.land_size || 0;
  document.getElementById('building_size').value = property.building_size || 0;
  document.getElementById('bedrooms').value = property.bedrooms || 0;
  document.getElementById('bathrooms').value = property.bathrooms || 0;
  document.getElementById('featured').value = String(Boolean(property.featured));
  document.getElementById('image_url').value = property.image_url || '';
  document.getElementById('gallery_urls').value = Array.isArray(property.gallery_urls)
    ? property.gallery_urls.join(' | ')
    : String(property.gallery_urls || '');
  document.getElementById('description').value = property.description || '';
  document.getElementById('contact_name').value = property.contact_name || '';
  document.getElementById('contact_phone').value = property.contact_phone || '';
}

function resetPropertyForm() {
  propertyForm.reset();
  document.getElementById('propertyId').value = '';
}

function fillSettingsForm(settings) {
  const merged = { ...DUMMY_SETTINGS, ...settings };
  state.settings = merged;

  Object.keys(merged).forEach((key) => {
    const input = document.getElementById(key);
    if (input) {
      input.value = merged[key] || '';
    }
  });
  document.documentElement.style.setProperty('--theme-color', merged.theme_color || '#0f766e');
}

function collectSettingsForm() {
  const keys = [
    'company_name',
    'logo_url',
    'theme_color',
    'whatsapp_contact',
    'phone_number',
    'email',
    'office_address',
    'hero_title',
    'hero_subtitle'
  ];
  return keys.reduce((result, key) => {
    result[key] = getFormValue(key);
    return result;
  }, {});
}

function renderPropertyTable() {
  if (!state.properties.length) {
    propertyTableBody.innerHTML = '<tr><td colspan="7" class="muted">Belum ada properti.</td></tr>';
    return;
  }

  propertyTableBody.innerHTML = state.properties
    .map((property) => `
      <tr>
        <td>${escapeHtml(property.id)}</td>
        <td>${escapeHtml(property.title)}</td>
        <td>${escapeHtml(property.location)}</td>
        <td>${escapeHtml(property.property_type)}</td>
        <td><span class="status ${safeStatus(property.status)}">${escapeHtml(property.status)}</span></td>
        <td>${formatIDR(property.price)}</td>
        <td>
          <div class="inline-actions">
            <button class="btn btn-secondary" data-action="edit" data-id="${escapeHtml(property.id)}" type="button">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${escapeHtml(property.id)}" type="button">Hapus</button>
          </div>
        </td>
      </tr>
    `)
    .join('');
}

async function loadSettings(options = {}) {
  const { allowFallback = true } = options;
  try {
    const response = await apiGetSettings();
    fillSettingsForm(response.data?.settings || response.data || DUMMY_SETTINGS);
  } catch (error) {
    if (!allowFallback) {
      throw error;
    }
    fillSettingsForm(DUMMY_SETTINGS);
    setMessage(settingsMessage, `Fallback ke dummy settings: ${error.message}`, true);
  }
}

async function loadProperties(options = {}) {
  const { allowFallback = true } = options;
  try {
    const response = await apiGetProperties({ page: 1, limit: 200 });
    const list = response.data?.items || response.data || [];
    state.properties = list.map(normalizeProperty);
  } catch (error) {
    if (!allowFallback) {
      throw error;
    }
    state.properties = DUMMY_PROPERTIES.map(normalizeProperty);
    setMessage(propertyMessage, `Fallback ke dummy properties: ${error.message}`, true);
  }

  renderPropertyTable();
}

function findPropertyById(id) {
  return state.properties.find((item) => item.id === id);
}

async function handlePropertySubmit(event) {
  event.preventDefault();
  const property = collectPropertyForm();

  try {
    if (!property.title || !property.location || !property.image_url || !property.description || !property.contact_name || !property.contact_phone) {
      throw new Error('Judul, lokasi, gambar, deskripsi, dan kontak wajib diisi.');
    }

    if (property.id) {
      await apiUpdateProperty(property, state.token);
      setMessage(propertyMessage, 'Properti berhasil diperbarui.');
    } else {
      delete property.id;
      await apiCreateProperty(property, state.token);
      setMessage(propertyMessage, 'Properti baru berhasil ditambahkan.');
    }

    resetPropertyForm();
    await loadProperties();
  } catch (error) {
    setMessage(propertyMessage, error.message, true);
  }
}

async function handleSettingsSubmit(event) {
  event.preventDefault();
  const payload = collectSettingsForm();

  try {
    await apiUpdateSettings(payload, state.token);
    fillSettingsForm(payload);
    setMessage(settingsMessage, 'Pengaturan website berhasil disimpan.');
  } catch (error) {
    setMessage(settingsMessage, error.message, true);
  }
}

async function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id) {
    return;
  }

  if (action === 'edit') {
    const property = findPropertyById(id);
    if (property) {
      fillPropertyForm(property);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Hapus properti ${id}? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) {
      return;
    }
    try {
      await apiDeleteProperty(id, state.token);
      setMessage(propertyMessage, 'Properti berhasil dihapus.');
      await loadProperties();
    } catch (error) {
      setMessage(propertyMessage, error.message, true);
    }
  }
}

function setAuthenticated(isAuthenticated) {
  authPanel.classList.toggle('hidden', isAuthenticated);
  dashboardSection.classList.toggle('hidden', !isAuthenticated);
}

async function enterDashboard(token) {
  if (!token) {
    throw new Error('Token admin tidak valid.');
  }

  await apiUpdateSettings({}, token);

  state.token = token;
  sessionStorage.setItem(TOKEN_KEY, token);
  document.getElementById('adminTokenInput').value = '';
  setMessage(authMessage, 'Autentikasi berhasil. Memuat dashboard...');
  await Promise.all([
    loadSettings({ allowFallback: false }),
    loadProperties({ allowFallback: false })
  ]);
  setAuthenticated(true);
}

function logout() {
  state.token = '';
  sessionStorage.removeItem(TOKEN_KEY);
  setAuthenticated(false);
  setMessage(authMessage, 'Anda telah logout.');
}

function setupEvents() {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = document.getElementById('adminTokenInput').value.trim();
    if (!token) {
      setMessage(authMessage, 'Token admin wajib diisi.', true);
      return;
    }
    try {
      await enterDashboard(token);
    } catch (error) {
      setAuthenticated(false);
      setMessage(authMessage, error.message, true);
    }
  });

  logoutBtn.addEventListener('click', logout);
  propertyForm.addEventListener('submit', handlePropertySubmit);
  settingsForm.addEventListener('submit', handleSettingsSubmit);
  propertyTableBody.addEventListener('click', handleTableClick);
  resetPropertyFormBtn.addEventListener('click', resetPropertyForm);
}

async function init() {
  setupEvents();
  if (state.token) {
    await enterDashboard(state.token);
  }
}

init();
