var SHEET_PROPERTIES = 'Properties';
var SHEET_SETTINGS = 'Settings';

var PROPERTY_COLUMNS = [
  'id',
  'title',
  'slug',
  'price',
  'location',
  'address',
  'property_type',
  'bedrooms',
  'bathrooms',
  'land_size',
  'building_size',
  'status',
  'description',
  'image_url',
  'gallery_urls',
  'contact_name',
  'contact_phone',
  'featured',
  'created_at',
  'updated_at'
];

var SETTINGS_COLUMNS = ['key', 'value'];

var ALLOWED_TYPES = ['rumah', 'apartemen', 'ruko', 'tanah', 'villa'];
var ALLOWED_STATUS = ['available', 'booking', 'sold'];
var DEFAULT_SETTINGS = {
  company_name: 'Nusantara Prime Property',
  logo_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=120&q=80',
  theme_color: '#0f766e',
  whatsapp_contact: '+6281219988776',
  phone_number: '+62 21 5098 8800',
  email: 'hello@nusantaraprime.id',
  office_address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
  hero_title: 'Temukan Properti Premium untuk Hunian dan Investasi',
  hero_subtitle: 'Listing terpilih di Jakarta, Tangerang, Bekasi, Bandung, Surabaya, dan Bali.'
};
var PUBLIC_SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS);

var MAX_LIMIT = 50;
var MAX_BODY_LENGTH = 100000;

function doGet(e) {
  return routeRequest_('GET', e, null);
}

function doPost(e) {
  var payload = parseJsonBody_(e);
  var method = resolveMethod_(e, payload);
  return routeRequest_(method, e, payload);
}

function routeRequest_(method, e, payload) {
  try {
    ensureSheets_();
    var resource = resolveResource_(e, payload);

    if (resource === 'properties') {
      if (method === 'GET') {
        var params = e.parameter || {};
        var idParam = sanitizeText_(params.id || '', 100);
        var slugParam = sanitizeText_(params.slug || '', 150);

        if (idParam || slugParam) {
          return okResponse_({ item: getPropertyByIdOrSlug_(idParam, slugParam) });
        }

        return okResponse_(getFilteredProperties_(params));
      }

      var token = extractToken_(e, payload);
      requireAdminToken_(token);

      if (method === 'POST') {
        return okResponse_({ item: createProperty_(payload && payload.data ? payload.data : payload) }, 'Property created successfully.');
      }
      if (method === 'PUT') {
        return okResponse_({ item: updateProperty_(payload && payload.data ? payload.data : payload) }, 'Property updated successfully.');
      }
      if (method === 'DELETE') {
        return okResponse_({ id: deleteProperty_(payload && payload.data ? payload.data : payload) }, 'Property deleted successfully.');
      }

      throw new ApiError_('Method not allowed for /properties', 405);
    }

    if (resource === 'settings') {
      if (method === 'GET') {
        return okResponse_({ settings: getSettingsMap_() });
      }

      if (method !== 'PUT') {
        throw new ApiError_('Method not allowed for /settings', 405);
      }

      var settingsToken = extractToken_(e, payload);
      requireAdminToken_(settingsToken);
      return okResponse_({ settings: updateSettings_(payload && payload.data ? payload.data : payload) }, 'Settings updated successfully.');
    }

    throw new ApiError_('Resource not found', 404);
  } catch (err) {
    return errorResponse_(err);
  }
}

function resolveMethod_(e, payload) {
  var method = 'POST';
  var override = null;
  if (payload && payload.method) {
    override = payload.method;
  } else if (payload && payload._method) {
    override = payload._method;
  } else if (e && e.parameter && e.parameter._method) {
    override = e.parameter._method;
  }
  if (override) {
    method = String(override).toUpperCase();
  }
  return method;
}

function resolveResource_(e, payload) {
  var fromPayload = payload && payload.resource ? payload.resource : '';
  var fromParam = e && e.parameter && e.parameter.resource ? e.parameter.resource : '';
  var fromPath = e && e.pathInfo ? e.pathInfo : '';
  var raw = fromPayload || fromParam || fromPath;
  raw = sanitizePath_(raw);
  if (!raw) {
    throw new ApiError_('Missing resource path', 400);
  }
  return raw.split('/')[0];
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  var raw = e.postData.contents;
  if (raw.length > MAX_BODY_LENGTH) {
    throw new ApiError_('Payload too large', 413);
  }
  try {
    var parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ApiError_('Body must be a JSON object', 400);
    }
    return parsed;
  } catch (error) {
    if (error instanceof ApiError_) {
      throw error;
    }
    throw new ApiError_('Invalid JSON request body', 400);
  }
}

function extractToken_(e, payload) {
  var fromPayload = payload && payload.admin_token ? payload.admin_token : '';
  var fromNestedPayload = payload && payload.data && payload.data.admin_token ? payload.data.admin_token : '';
  var fromAltPayload = payload && payload.token ? payload.token : '';
  var fromParam = e && e.parameter && e.parameter.admin_token ? e.parameter.admin_token : '';
  return sanitizeText_(fromPayload || fromNestedPayload || fromAltPayload || fromParam, 255);
}

function requireAdminToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_API_TOKEN');
  if (!expected) {
    throw new ApiError_('Server misconfiguration: ADMIN_API_TOKEN is not set', 500);
  }
  if (!token) {
    throw new ApiError_('Unauthorized: missing admin token', 401);
  }
  if (token !== expected) {
    throw new ApiError_('Unauthorized: invalid admin token', 401);
  }
}

function ensureSheets_() {
  getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
  getOrCreateSheet_(SHEET_SETTINGS, SETTINGS_COLUMNS);
}

function getOrCreateSheet_(sheetName, headers) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeader = existingHeaders.join('').trim() === '';

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function readRowsAsObjects_(sheet, columns) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  var values = sheet.getRange(2, 1, lastRow - 1, columns.length).getValues();
  return values.map(function (row) {
    var item = {};
    columns.forEach(function (col, idx) {
      item[col] = row[idx];
    });
    return item;
  });
}

function getFilteredProperties_(params) {
  var sheet = getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
  var rows = readRowsAsObjects_(sheet, PROPERTY_COLUMNS);

  var q = sanitizeText_(params.q || '', 80).toLowerCase();
  var location = sanitizeText_(params.location || '', 80).toLowerCase();
  var propertyType = sanitizeEnum_(params.property_type || '', ALLOWED_TYPES, false);
  var status = sanitizeEnum_(params.status || '', ALLOWED_STATUS, false);
  var minPrice = parseNumber_(params.min_price, 0);
  var maxPrice = parseNumber_(params.max_price, Number.MAX_SAFE_INTEGER);
  var featuredParam = String(params.featured || '').toLowerCase();

  var filtered = rows.filter(function (item) {
    var itemPrice = Number(item.price || 0);
    var haystack = [item.title, item.location, item.address, item.description, item.property_type]
      .join(' ')
      .toLowerCase();

    if (q && haystack.indexOf(q) === -1) {
      return false;
    }
    if (location && String(item.location || '').toLowerCase().indexOf(location) === -1) {
      return false;
    }
    if (propertyType && String(item.property_type || '').toLowerCase() !== propertyType) {
      return false;
    }
    if (status && String(item.status || '').toLowerCase() !== status) {
      return false;
    }
    if (itemPrice < minPrice || itemPrice > maxPrice) {
      return false;
    }
    if (featuredParam) {
      var isFeatured = String(item.featured).toLowerCase() === 'true';
      if (featuredParam === 'true' && !isFeatured) {
        return false;
      }
      if (featuredParam === 'false' && isFeatured) {
        return false;
      }
    }

    return true;
  });

  filtered.sort(function (a, b) {
    var aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    var bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  var pagination = getPagination_(params, filtered.length);
  var paginated = filtered.slice(pagination.offset, pagination.offset + pagination.limit);
  return {
    items: paginated.map(normalizePropertyOutput_),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total_items: pagination.total,
      total_pages: pagination.totalPages
    }
  };
}

function getPropertyByIdOrSlug_(id, slug) {
  var sheet = getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
  var rows = readRowsAsObjects_(sheet, PROPERTY_COLUMNS);

  var match = rows.find(function (item) {
    if (id) {
      return String(item.id) === id;
    }
    return String(item.slug) === slug;
  });

  if (!match) {
    throw new ApiError_('Property not found', 404);
  }

  return normalizePropertyOutput_(match);
}

function getPagination_(params, totalRows) {
  var page = Math.max(1, parseInt_(params.page, 1));
  var limit = Math.max(1, parseInt_(params.limit, 12));
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  var totalPages = Math.max(1, Math.ceil(totalRows / limit));
  if (page > totalPages) {
    page = totalPages;
  }

  return {
    page: page,
    limit: limit,
    total: totalRows,
    totalPages: totalPages,
    offset: (page - 1) * limit
  };
}

function createProperty_(input) {
  return withWriteLock_(function () {
    var normalized = normalizePropertyInput_(input || {}, false, null);
    var now = new Date().toISOString();
    normalized.id = generatePropertyId_();
    normalized.slug = normalizeSlug_(normalized.title + '-' + normalized.location);
    normalized.created_at = now;
    normalized.updated_at = now;

    var sheet = getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
    sheet.appendRow(objectToRow_(normalized, PROPERTY_COLUMNS));
    return normalizePropertyOutput_(normalized);
  });
}

function updateProperty_(input) {
  return withWriteLock_(function () {
    var payload = input || {};
    var id = sanitizeText_(payload.id || '', 80);
    if (!id) {
      throw new ApiError_('Property id is required for update', 400);
    }

    var sheet = getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
    var rows = readRowsAsObjects_(sheet, PROPERTY_COLUMNS);
    var index = findPropertyIndexById_(rows, id);
    if (index === -1) {
      throw new ApiError_('Property not found', 404);
    }

    var existing = rows[index];
    var merged = normalizePropertyInput_(payload, true, existing);
    merged.id = existing.id;
    merged.slug = payload.slug ? normalizeSlug_(payload.slug) : existing.slug || normalizeSlug_(merged.title + '-' + merged.location);
    merged.created_at = existing.created_at || new Date().toISOString();
    merged.updated_at = new Date().toISOString();

    var targetRow = index + 2;
    sheet.getRange(targetRow, 1, 1, PROPERTY_COLUMNS.length).setValues([objectToRow_(merged, PROPERTY_COLUMNS)]);
    return normalizePropertyOutput_(merged);
  });
}

function deleteProperty_(input) {
  return withWriteLock_(function () {
    var payload = input || {};
    var id = sanitizeText_(payload.id || '', 80);
    if (!id) {
      throw new ApiError_('Property id is required for delete', 400);
    }

    var sheet = getOrCreateSheet_(SHEET_PROPERTIES, PROPERTY_COLUMNS);
    var rows = readRowsAsObjects_(sheet, PROPERTY_COLUMNS);
    var index = findPropertyIndexById_(rows, id);
    if (index === -1) {
      throw new ApiError_('Property not found', 404);
    }

    sheet.deleteRow(index + 2);
    return id;
  });
}

function findPropertyIndexById_(rows, id) {
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === id) {
      return i;
    }
  }
  return -1;
}

function normalizePropertyInput_(input, isUpdate, existing) {
  var source = existing || {};

  var merged = {
    title: sanitizeText_(pickValue_(input.title, source.title), 120),
    location: sanitizeText_(pickValue_(input.location, source.location), 80),
    address: sanitizeText_(pickValue_(input.address, source.address), 250),
    property_type: sanitizeEnum_(pickValue_(input.property_type, source.property_type), ALLOWED_TYPES, true),
    status: sanitizeEnum_(pickValue_(input.status, source.status), ALLOWED_STATUS, true),
    price: parseNumber_(pickValue_(input.price, source.price), 0),
    bedrooms: parseInt_(pickValue_(input.bedrooms, source.bedrooms), 0),
    bathrooms: parseInt_(pickValue_(input.bathrooms, source.bathrooms), 0),
    land_size: parseNumber_(pickValue_(input.land_size, source.land_size), 0),
    building_size: parseNumber_(pickValue_(input.building_size, source.building_size), 0),
    description: sanitizeText_(pickValue_(input.description, source.description), 1500),
    image_url: sanitizeUrl_(pickValue_(input.image_url, source.image_url)),
    gallery_urls: normalizeGallery_(pickValue_(input.gallery_urls, source.gallery_urls)),
    contact_name: sanitizeText_(pickValue_(input.contact_name, source.contact_name), 80),
    contact_phone: sanitizePhone_(pickValue_(input.contact_phone, source.contact_phone)),
    featured: String(parseBoolean_(pickValue_(input.featured, source.featured), false))
  };

  if (!isUpdate) {
    var required = ['title', 'location', 'address', 'property_type', 'status', 'description', 'image_url', 'contact_name', 'contact_phone'];
    required.forEach(function (field) {
      if (!merged[field]) {
        throw new ApiError_('Missing required field: ' + field, 400);
      }
    });
  }

  return merged;
}

function normalizePropertyOutput_(item) {
  var clone = {};
  PROPERTY_COLUMNS.forEach(function (col) {
    clone[col] = item[col];
  });

  clone.price = Number(clone.price || 0);
  clone.bedrooms = Number(clone.bedrooms || 0);
  clone.bathrooms = Number(clone.bathrooms || 0);
  clone.land_size = Number(clone.land_size || 0);
  clone.building_size = Number(clone.building_size || 0);
  clone.featured = String(clone.featured).toLowerCase() === 'true';
  clone.gallery_urls = String(clone.gallery_urls || '')
    .split(/[|,\n]/)
    .map(function (url) { return sanitizeUrl_(url); })
    .filter(function (url) { return !!url; });

  return clone;
}

function getSettingsMap_() {
  var sheet = getOrCreateSheet_(SHEET_SETTINGS, SETTINGS_COLUMNS);
  var rows = readRowsAsObjects_(sheet, SETTINGS_COLUMNS);
  var settings = {};

  rows.forEach(function (row) {
    var key = sanitizeText_(row.key, 60);
    if (!key) {
      return;
    }
    if (PUBLIC_SETTINGS_KEYS.indexOf(key) === -1) {
      return;
    }
    settings[key] = String(row.value || '');
  });

  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    if (!settings[key]) {
      settings[key] = DEFAULT_SETTINGS[key];
    }
  });

  return settings;
}

function updateSettings_(input) {
  return withWriteLock_(function () {
    var payload = input || {};
    var updates = payload.settings ? payload.settings : payload;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new ApiError_('Settings payload must be an object', 400);
    }

    var sheet = getOrCreateSheet_(SHEET_SETTINGS, SETTINGS_COLUMNS);
    var rows = readRowsAsObjects_(sheet, SETTINGS_COLUMNS);
    var keyIndex = {};
    rows.forEach(function (row, idx) {
      keyIndex[String(row.key)] = idx + 2;
    });

    Object.keys(updates).forEach(function (rawKey) {
      var key = sanitizeText_(rawKey, 60);
      if (!key) {
        return;
      }
      if (PUBLIC_SETTINGS_KEYS.indexOf(key) === -1) {
        throw new ApiError_('Unknown setting key: ' + key, 400);
      }
      var value = sanitizeText_(updates[rawKey], 600);

      if (key === 'theme_color' && !/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw new ApiError_('theme_color must be a hex color, example: #0f766e', 400);
      }
      if (key === 'logo_url') {
        value = sanitizeUrl_(value);
      }
      if (key === 'email') {
        value = sanitizeEmail_(value);
      }
      if (key === 'whatsapp_contact' || key === 'phone_number') {
        value = sanitizePhone_(value);
      }

      if (keyIndex[key]) {
        sheet.getRange(keyIndex[key], 2).setValue(protectCell_(value));
      } else {
        sheet.appendRow([protectCell_(key), protectCell_(value)]);
      }
    });

    return getSettingsMap_();
  });
}

function withWriteLock_(callback) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function objectToRow_(obj, columns) {
  return columns.map(function (col) {
    return protectCell_(obj[col]);
  });
}

function protectCell_(value) {
  var output = value;
  if (output === null || output === undefined) {
    return '';
  }
  if (typeof output === 'number' || typeof output === 'boolean') {
    return output;
  }
  output = String(output).trim();
  if (/^[=+\-@]/.test(output)) {
    output = "'" + output;
  }
  return output;
}

function pickValue_(incoming, fallback) {
  if (incoming === undefined || incoming === null || incoming === '') {
    return fallback;
  }
  return incoming;
}

function parseBoolean_(value, fallback) {
  if (value === true || value === false) {
    return value;
  }
  var text = String(value || '').toLowerCase().trim();
  if (text === 'true' || text === '1' || text === 'yes') {
    return true;
  }
  if (text === 'false' || text === '0' || text === 'no') {
    return false;
  }
  return fallback;
}

function parseInt_(value, fallback) {
  var num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    return fallback;
  }
  return num;
}

function parseNumber_(value, fallback) {
  var num = Number(value);
  if (isNaN(num) || num < 0) {
    return fallback;
  }
  return num;
}

function sanitizeEnum_(value, allowed, required) {
  var text = sanitizeText_(value || '', 30).toLowerCase();
  if (!text && !required) {
    return '';
  }
  if (allowed.indexOf(text) === -1) {
    throw new ApiError_('Invalid value: ' + text, 400);
  }
  return text;
}

function sanitizeText_(value, maxLen) {
  var text = String(value === undefined || value === null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (!text) {
    return '';
  }
  return text.slice(0, maxLen || 255);
}

function sanitizePath_(value) {
  var text = sanitizeText_(value, 120).toLowerCase();
  return text.replace(/[^a-z0-9_\/-]/g, '').replace(/^\/+|\/+$/g, '');
}

function sanitizeUrl_(value) {
  var text = sanitizeText_(value, 500);
  if (!text) {
    return '';
  }
  if (!/^https?:\/\//i.test(text)) {
    throw new ApiError_('URL must start with http:// or https://', 400);
  }
  return text;
}

function sanitizePhone_(value) {
  var text = String(value || '').replace(/[^\d+]/g, '');
  if (!text) {
    return '';
  }
  if (text.length < 8 || text.length > 20) {
    throw new ApiError_('Phone number format is invalid', 400);
  }
  return text;
}

function sanitizeEmail_(value) {
  var text = sanitizeText_(value, 120).toLowerCase();
  if (!text) {
    return '';
  }
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(text)) {
    throw new ApiError_('Invalid email format', 400);
  }
  return text;
}

function normalizeSlug_(text) {
  var slug = sanitizeText_(text, 140)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (!slug) {
    slug = 'property-' + new Date().getTime();
  }
  return slug;
}

function normalizeGallery_(value) {
  if (!value) {
    return '';
  }
  var list;
  if (Array.isArray(value)) {
    list = value;
  } else {
    list = String(value).split(/[|,\n]/);
  }
  return list
    .map(function (item) { return sanitizeUrl_(item); })
    .filter(function (item) { return !!item; })
    .slice(0, 10)
    .join('|');
}

function generatePropertyId_() {
  return 'P' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function okResponse_(data, message) {
  return jsonResponse_({
    success: true,
    message: message || 'OK',
    data: data,
    statusCode: 200,
    timestamp: new Date().toISOString()
  });
}

function errorResponse_(err) {
  var status = 500;
  var message = 'Internal server error';

  if (err instanceof ApiError_) {
    status = err.status;
    message = err.message;
  } else if (err && err.message) {
    message = err.message;
  }

  return jsonResponse_({
    success: false,
    message: message,
    data: null,
    statusCode: status,
    timestamp: new Date().toISOString()
  });
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ApiError_(message, status) {
  this.name = 'ApiError';
  this.message = message;
  this.status = status || 400;
}
ApiError_.prototype = Object.create(Error.prototype);
ApiError_.prototype.constructor = ApiError_;
