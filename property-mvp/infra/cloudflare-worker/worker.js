const CACHEABLE_PATHS = new Set(['/api/properties', '/api/settings']);
const DEFAULT_CACHE_TTL = 120;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const rateStore = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return handlePreflight(request, env);
    }

    if (!url.pathname.startsWith('/api/')) {
      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        return env.ASSETS.fetch(request);
      }
      return withCors(
        new Response(JSON.stringify({ success: false, message: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }),
        request,
        env
      );
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const isAdminMethod = method !== 'GET';
    const limitResult = applyRateLimit(ip, isAdminMethod ? RATE_LIMIT_MAX / 2 : RATE_LIMIT_MAX);
    if (!limitResult.allowed) {
      return withCors(
        new Response(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please retry shortly.',
            statusCode: 429
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(limitResult.retryAfterSeconds)
            }
          }
        ),
        request,
        env
      );
    }

    const route = resolveRoute(url.pathname);
    if (!route) {
      return withCors(
        new Response(JSON.stringify({ success: false, message: 'Unknown API route', statusCode: 404 }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }),
        request,
        env
      );
    }

    if (!isMethodAllowed(route.resource, method)) {
      return withCors(
        new Response(JSON.stringify({ success: false, message: 'Method not allowed', statusCode: 405 }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }),
        request,
        env
      );
    }

    const adminTokenHeader = parseBearerToken(request.headers.get('Authorization'));
    if (isAdminMethod) {
      const expectedAdminToken = env.ADMIN_TOKEN || '';
      if (!expectedAdminToken || adminTokenHeader !== expectedAdminToken) {
        return withCors(
          new Response(JSON.stringify({ success: false, message: 'Unauthorized', statusCode: 401 }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }),
          request,
          env
        );
      }
    }

    try {
      if (method === 'GET' && CACHEABLE_PATHS.has(url.pathname)) {
        return await handleCachedGet(request, env, ctx, route);
      }

      return await proxyRequestToGas(request, env, route, adminTokenHeader);
    } catch (error) {
      return withCors(
        new Response(
          JSON.stringify({
            success: false,
            message: error.message || 'Unhandled Worker error',
            statusCode: 500
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        ),
        request,
        env
      );
    }
  }
};

function resolveRoute(pathname) {
  const normalized = pathname.replace(/\/+$/, '');
  if (normalized === '/api/properties') {
    return { resource: 'properties' };
  }
  if (normalized === '/api/settings') {
    return { resource: 'settings' };
  }
  return null;
}

function isMethodAllowed(resource, method) {
  if (resource === 'properties') {
    return ['GET', 'POST', 'PUT', 'DELETE'].includes(method);
  }
  if (resource === 'settings') {
    return ['GET', 'PUT'].includes(method);
  }
  return false;
}

function parseBearerToken(headerValue) {
  if (!headerValue) {
    return '';
  }
  const parts = headerValue.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return '';
  }
  return parts[1].trim();
}

async function handleCachedGet(request, env, ctx, route) {
  const incomingUrl = new URL(request.url);
  const canonicalUrl = new URL(incomingUrl.origin + incomingUrl.pathname);

  const sortedParams = [...incomingUrl.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [key, value] of sortedParams) {
    canonicalUrl.searchParams.set(key, value);
  }

  const cacheKey = new Request(canonicalUrl.toString(), { method: 'GET' });

  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set('X-Cache-Status', 'HIT');
    return withCors(response, request, env);
  }

  const fresh = await proxyRequestToGas(request, env, route, '');
  if (fresh.ok) {
    const ttl = Number(env.CACHE_TTL_SECONDS || DEFAULT_CACHE_TTL);
    const cacheable = new Response(fresh.body, fresh);
    cacheable.headers.set('Cache-Control', `public, max-age=${ttl}`);
    cacheable.headers.set('X-Cache-Status', 'MISS');
    ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));
    return withCors(cacheable, request, env);
  }

  return withCors(fresh, request, env);
}

async function proxyRequestToGas(request, env, route, adminToken) {
  const method = request.method.toUpperCase();
  const gasBaseUrl = (env.GAS_WEB_APP_URL || '').trim();
  if (!gasBaseUrl) {
    throw new Error('Worker env GAS_WEB_APP_URL is required');
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(gasBaseUrl);
  upstreamUrl.searchParams.set('resource', route.resource);

  let bodyPayload = null;
  if (method === 'GET') {
    for (const [key, value] of incomingUrl.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }
  } else {
    const text = await request.text();
    if (text.length > 100000) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payload too large', statusCode: 413 }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let parsed = {};
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid JSON body', statusCode: 400 }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    bodyPayload = {
      resource: route.resource,
      method,
      data: parsed,
      admin_token: env.GAS_ADMIN_TOKEN || adminToken || ''
    };
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: method === 'GET' ? null : JSON.stringify(bodyPayload)
  });

  const text = await upstreamResponse.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = {
      success: upstreamResponse.ok,
      message: upstreamResponse.ok ? 'OK' : 'Upstream returned non-JSON response',
      data: text,
      statusCode: upstreamResponse.status
    };
  }

  const status = Number(payload.statusCode || upstreamResponse.status || 200);
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function applyRateLimit(ip, maxPerWindow) {
  const now = Date.now();
  const entry = rateStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    };
  }

  entry.count += 1;
  rateStore.set(ip, entry);
  return { allowed: true, retryAfterSeconds: 0 };
}

function handlePreflight(request, env) {
  const headers = new Headers();
  const origin = resolveAllowedOrigin(request, env);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return new Response(null, { status: 204, headers });
}

function withCors(response, request, env) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', resolveAllowedOrigin(request, env));
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Vary', 'Origin');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('Referrer-Policy', 'no-referrer');
  return newResponse;
}

function resolveAllowedOrigin(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || '*').trim();
  if (allowed === '*') {
    return '*';
  }

  const requestOrigin = request.headers.get('Origin') || '';
  const allowList = allowed.split(',').map((item) => item.trim());
  if (allowList.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowList[0] || '*';
}
