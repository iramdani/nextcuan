const DEFAULT_TIMEOUT_MS = 15000;

const APP_CONFIG = {
  API_BASE_URL: '/api',
  PAGE_SIZE: 6,
  CURRENCY_LOCALE: 'id-ID',
  ...window.APP_CONFIG
};

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

async function request(path, { method = 'GET', data, token, query } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestOptions = {
    method,
    headers,
    signal: controller.signal
  };

  if (data !== undefined) {
    requestOptions.body = JSON.stringify(data);
  }

  const baseUrl = APP_CONFIG.API_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}${path}${buildQueryString(query)}`;

  try {
    const response = await fetch(url, requestOptions);
    const payload = await response.json().catch(() => {
      throw new Error('Respons API tidak valid (bukan JSON).');
    });

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `Request gagal dengan status ${response.status}`);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function formatIDR(value) {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat(APP_CONFIG.CURRENCY_LOCALE, {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(numeric);
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

export function toWhatsAppLink(phone, title) {
  const cleaned = normalizePhone(phone).replace(/^\+/, '');
  const text = encodeURIComponent(`Halo, saya tertarik dengan properti: ${title}`);
  return `https://wa.me/${cleaned}?text=${text}`;
}

export async function apiGetSettings() {
  return request('/settings');
}

export async function apiUpdateSettings(settingsPayload, token) {
  return request('/settings', {
    method: 'PUT',
    data: { settings: settingsPayload },
    token
  });
}

export async function apiGetProperties(query = {}) {
  return request('/properties', { query });
}

export async function apiGetPropertyById(id) {
  return request('/properties', {
    query: { id }
  });
}

export async function apiCreateProperty(property, token) {
  return request('/properties', {
    method: 'POST',
    data: property,
    token
  });
}

export async function apiUpdateProperty(property, token) {
  return request('/properties', {
    method: 'PUT',
    data: property,
    token
  });
}

export async function apiDeleteProperty(id, token) {
  return request('/properties', {
    method: 'DELETE',
    data: { id },
    token
  });
}

export { APP_CONFIG };
