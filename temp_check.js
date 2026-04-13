






        // NOTE: This is intentionally defined early (in this <head> script)
        // because other early boot scripts call it before the main app script
        // near the bottom of the page is evaluated.
        function getApiEndpoint() {
            try {
                if (window.API_URL) return window.API_URL;
                const host = location.hostname;
                if (location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1') {
                    return (typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : null;
                }
                return '/api';
            } catch (e) {
                return window.API_URL || ((typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : '/api');
            }
        }

        function buildFallbackFavicon(siteName) {
            const label = String(siteName || 'A').trim().charAt(0).toUpperCase() || 'A';
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#4f46e5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${label}</text></svg>`;
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }

        function normalizeBrandAssetUrl(value) {
            const raw = String(value || '').trim();
            if (!raw) return '';
            if (/^data:image\//i.test(raw)) return raw;
            if (raw.charAt(0) === '/') return raw;
            try {
                const parsed = new URL(raw);
                const protocol = String(parsed.protocol || '').toLowerCase();
                const hostname = String(parsed.hostname || '').toLowerCase();
                if (protocol !== 'http:' && protocol !== 'https:') return '';
                if (
                    hostname === 'example.com' ||
                    hostname === 'example.org' ||
                    hostname === 'example.net' ||
                    hostname.endsWith('.example.com') ||
                    hostname.endsWith('.example.org') ||
                    hostname.endsWith('.example.net')
                ) {
                    return '';
                }
                return parsed.href;
            } catch (e) {
                return '';
            }
        }

        function applyBrandLogo(imgEl, iconEl, logoUrl) {
            if (!imgEl || !iconEl) return;
            const safeUrl = normalizeBrandAssetUrl(logoUrl);
            if (!safeUrl) {
                imgEl.classList.add('hidden');
                iconEl.classList.remove('hidden');
                imgEl.removeAttribute('src');
                return;
            }

            imgEl.onload = () => {
                imgEl.classList.remove('hidden');
                iconEl.classList.add('hidden');
            };
            imgEl.onerror = () => {
                imgEl.classList.add('hidden');
                iconEl.classList.remove('hidden');
                imgEl.removeAttribute('src');
            };
            imgEl.src = safeUrl;
        }

        function applyBrandFavicon(faviconUrl, siteName) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }

            const fallback = buildFallbackFavicon(siteName);
            const safeUrl = normalizeBrandAssetUrl(faviconUrl);
            if (!safeUrl) {
                link.href = fallback;
                return;
            }

            const probe = new Image();
            probe.onload = () => {
                link.href = safeUrl;
            };
            probe.onerror = () => {
                link.href = fallback;
            };
            probe.src = safeUrl;
        }

        function normalizeMootaInput(value) {
            return String(value || '').trim();
        }

        function normalizeMootaUrl(value) {
            const raw = normalizeMootaInput(value);
            if (!raw) return '';
            try {
                const parsed = new URL(raw);
                parsed.search = '';
                parsed.hash = '';
                return parsed.toString().replace(/\?$/, '');
            } catch (e) {
                return raw;
            }
        }

        function isValidMootaUrl(value) {
            const url = normalizeMootaUrl(value);
            if (!url) return false;
            try {
                const parsed = new URL(url);
                return parsed.protocol === 'https:' && !parsed.search && !parsed.hash;
            } catch (e) {
                return false;
            }
        }

        function isDirectAppsScriptUrl(value) {
            const url = normalizeMootaUrl(value);
            if (!url) return false;
            try {
                const parsed = new URL(url);
                const host = String(parsed.hostname || '').toLowerCase();
                return host === 'script.google.com' || host === 'script.googleusercontent.com';
            } catch (e) {
                return false;
            }
        }

        function isValidMootaToken(value) {
            return /^[A-Za-z0-9]{8,200}$/.test(normalizeMootaInput(value));
        }

        function setMootaStatus(message, type = 'info') {
            const box = document.getElementById('moota-test-status');
            if (!box) return;
            box.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-700', 'bg-sky-50', 'border-sky-200', 'text-sky-700', 'bg-emerald-50', 'border-emerald-200', 'text-emerald-700', 'bg-amber-50', 'border-amber-200', 'text-amber-700', 'bg-slate-50', 'border-slate-200', 'text-slate-600');
            if (type === 'error') {
                box.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
            } else if (type === 'success') {
                box.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
            } else if (type === 'warning') {
                box.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-700');
            } else if (type === 'brand') {
                box.classList.add('bg-sky-50', 'border-sky-200', 'text-sky-700');
            } else {
                box.classList.add('bg-slate-50', 'border-slate-200', 'text-slate-600');
            }
            box.textContent = message;
        }

        function toggleSensitiveField(fieldId, buttonEl) {
            const input = document.getElementById(fieldId);
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            if (buttonEl) {
                buttonEl.textContent = input.type === 'password' ? 'Show' : 'Hide';
            }
        }

        function updateMootaHints(tokenConfigured) {
            MOOTA_TOKEN_CONFIGURED = !!tokenConfigured;

            const tokenHint = document.getElementById('moota-token-hint');
            const tokenInput = document.getElementById('set-moota-token');

            if (tokenHint && tokenInput) {
                if (MOOTA_TOKEN_CONFIGURED) {
                    tokenHint.textContent = 'Secret Token sudah tersimpan di server. Isi field ini hanya jika ingin mengganti token.';
                    tokenInput.placeholder = 'Secret Token sudah tersimpan. Isi hanya jika ingin mengganti.';
                } else {
                    tokenHint.textContent = 'Secret Token wajib diisi untuk memverifikasi signature HMAC webhook Moota.';
                    tokenInput.placeholder = 'Secret123';
                }
            }
        }

        function getMootaFormConfig() {
            return {
                gasUrl: normalizeMootaUrl(document.getElementById('set-moota-url').value),
                token: normalizeMootaInput(document.getElementById('set-moota-token').value),
                hasStoredToken: !!MOOTA_TOKEN_CONFIGURED
            };
        }

        function validateMootaFormConfig(config) {
            const cfg = config || getMootaFormConfig();
            const hasAnyValue = !!(cfg.gasUrl || cfg.token || cfg.hasStoredToken);
            const errors = [];
            if (!hasAnyValue) return { hasAnyValue: false, errors };

            if (!cfg.gasUrl) errors.push('Link webhook Moota wajib diisi.');
            else if (!isValidMootaUrl(cfg.gasUrl)) errors.push('Format link webhook Moota tidak valid. Gunakan HTTPS tanpa query string.');
            else if (isDirectAppsScriptUrl(cfg.gasUrl)) errors.push('Link webhook Moota tidak boleh langsung ke Google Apps Script. Gunakan endpoint Cloudflare Worker atau proxy publik agar header Signature bisa diteruskan.');

            if (!cfg.token && !cfg.hasStoredToken) errors.push('Secret Token Moota wajib diisi.');
            if (cfg.token && !isValidMootaToken(cfg.token)) errors.push('Format Secret Token Moota tidak valid. Gunakan minimal 8 karakter alphanumeric tanpa spasi.');

            return { hasAnyValue: true, errors };
        }

        async function testMootaConnection(options = {}) {
            const opts = options || {};
            try {
                const cfg = getMootaFormConfig();
                const validation = validateMootaFormConfig(cfg);

                if (!validation.hasAnyValue) {
                    const msg = 'Konfigurasi Moota masih kosong. Isi link webhook dan Secret Token terlebih dahulu.';
                    setMootaStatus(msg, 'warning');
                    if (!opts.silent) showToast(msg, 'warning');
                    return null;
                }

                if (validation.errors.length) {
                    throw new Error(validation.errors[0]);
                }

                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia.');

                setMootaStatus('Menguji webhook Moota...', 'brand');
                const payload = buildAdminAuthPayload({
                    action: 'test_moota_config',
                    moota_gas_url: cfg.gasUrl
                });
                if (cfg.token) payload.moota_token = cfg.token;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const rawText = await res.text();
                let data = {};
                try {
                    data = rawText ? JSON.parse(rawText) : {};
                } catch (parseError) {
                    throw new Error('Respons test Moota tidak valid dari server.');
                }

                if (!res.ok) {
                    throw new Error(data.message || ('Permintaan test Moota gagal (HTTP ' + res.status + ').'));
                }
                if (data.status !== 'success') {
                    throw new Error(String(data.message || 'Koneksi Moota gagal.'));
                }

                const saveReminder = cfg.token ? ' Klik "Update Moota Payment Gateway" untuk menyimpan Secret Token ini ke server.' : '';
                const msg = String(data.message || 'Koneksi webhook Moota berhasil.') + saveReminder;
                setMootaStatus(msg, 'success');
                if (!opts.silent) {
                    showToast(
                        cfg.token
                            ? 'Koneksi Moota berhasil diuji. Klik "Update Moota Payment Gateway" untuk menyimpan Secret Token.'
                            : 'Koneksi Moota berhasil diuji.',
                        'success'
                    );
                }
                return data;
            } catch (error) {
                const msg = error && error.message ? error.message : 'Koneksi Moota gagal.';
                setMootaStatus(msg, 'error');
                if (opts.silent) throw new Error(msg);
                showToast(msg, 'error');
                return null;
            }
        }

        function normalizeImageKitInput(value) {
            return String(value || '').trim();
        }

        function normalizeImageKitEndpoint(value) {
            return normalizeImageKitInput(value).replace(/\/+$/, '');
        }

        function isValidImageKitPublicKey(value) {
            return /^public_[A-Za-z0-9+/=._-]+$/.test(normalizeImageKitInput(value));
        }

        function isValidImageKitPrivateKey(value) {
            return /^private_[A-Za-z0-9+/=._-]+$/.test(normalizeImageKitInput(value));
        }

        function isValidImageKitEndpoint(value) {
            const endpoint = normalizeImageKitEndpoint(value);
            if (!endpoint) return false;
            try {
                const parsed = new URL(endpoint);
                return parsed.protocol === 'https:' && !parsed.search && !parsed.hash;
            } catch (e) {
                return false;
            }
        }

        function setImageKitStatus(message, type = 'info') {
            const box = document.getElementById('ik-test-status');
            if (!box) return;
            box.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-700', 'bg-emerald-50', 'border-emerald-200', 'text-emerald-700', 'bg-amber-50', 'border-amber-200', 'text-amber-700', 'bg-slate-50', 'border-slate-200', 'text-slate-600');
            if (type === 'error') {
                box.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
            } else if (type === 'success') {
                box.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-700');
            } else if (type === 'warning') {
                box.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-700');
            } else {
                box.classList.add('bg-slate-50', 'border-slate-200', 'text-slate-600');
            }
            box.textContent = message;
        }

        function updateImageKitPrivateHint(configured) {
            IK_PRIVATE_CONFIGURED = !!configured;
            const hint = document.getElementById('ik-private-hint');
            const input = document.getElementById('set-ik-priv');
            if (!hint || !input) return;
            if (IK_PRIVATE_CONFIGURED) {
                hint.textContent = 'Private key sudah tersimpan di server. Kosongkan field ini jika tidak ingin mengganti private key.';
                input.placeholder = 'Private key sudah tersimpan. Isi hanya jika ingin mengganti.';
            } else {
                hint.textContent = 'Private key belum tersimpan. Isi field ini agar Media Center bisa autentikasi ke ImageKit.';
                input.placeholder = 'private_xxxxx';
            }
        }

        function getImageKitFormConfig() {
            return {
                publicKey: normalizeImageKitInput(document.getElementById('set-ik-pub').value),
                endpoint: normalizeImageKitEndpoint(document.getElementById('set-ik-end').value),
                privateKey: normalizeImageKitInput(document.getElementById('set-ik-priv').value),
                hasStoredPrivateKey: !!IK_PRIVATE_CONFIGURED
            };
        }

        function validateImageKitFormConfig(config, options = {}) {
            const cfg = config || getImageKitFormConfig();
            const opts = options || {};
            const hasAnyValue = !!(cfg.publicKey || cfg.endpoint || cfg.privateKey);
            const errors = [];
            if (!hasAnyValue) return { hasAnyValue: false, errors };

            if (!cfg.publicKey) errors.push('ImageKit public key wajib diisi.');
            else if (!isValidImageKitPublicKey(cfg.publicKey)) errors.push('Format ImageKit public key tidak valid. Harus diawali dengan "public_".');

            if (!cfg.endpoint && !opts.allowMissingEndpoint) errors.push('ImageKit URL endpoint wajib diisi.');
            else if (cfg.endpoint && !isValidImageKitEndpoint(cfg.endpoint)) errors.push('Format ImageKit URL endpoint tidak valid. Gunakan HTTPS, misalnya https://ik.imagekit.io/nama-endpoint');

            if (!cfg.privateKey && !cfg.hasStoredPrivateKey) errors.push('ImageKit private key wajib diisi.');
            if (cfg.privateKey && !isValidImageKitPrivateKey(cfg.privateKey)) errors.push('Format ImageKit private key tidak valid. Harus diawali dengan "private_".');

            return { hasAnyValue: true, errors };
        }

        async function testImageKitConnection(options = {}) {
            const opts = options || {};
            try {
                const cfg = getImageKitFormConfig();
                const validation = validateImageKitFormConfig(cfg, { allowMissingEndpoint: true });

                if (!validation.hasAnyValue) {
                    const msg = 'Konfigurasi ImageKit masih kosong. Isi public key, URL endpoint, dan private key terlebih dahulu.';
                    setImageKitStatus(msg, 'warning');
                    if (!opts.silent) showToast(msg, 'warning');
                    return null;
                }

                if (validation.errors.length) {
                    throw new Error(validation.errors[0]);
                }

                const endpoint = getApiEndpoint();
                if (!endpoint) {
                    throw new Error('API endpoint tidak tersedia.');
                }

                setImageKitStatus('Menguji koneksi ImageKit...', 'info');
                const payload = buildAdminAuthPayload({
                    action: 'test_ik_config',
                    ik_public_key: cfg.publicKey,
                    ik_endpoint: cfg.endpoint
                });
                if (cfg.privateKey) payload.ik_private_key = cfg.privateKey;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const rawText = await res.text();
                let data = {};
                try {
                    data = rawText ? JSON.parse(rawText) : {};
                } catch (parseError) {
                    throw new Error('Respons test ImageKit tidak valid dari server.');
                }

                if (!res.ok) {
                    throw new Error(data.message || ('Permintaan test ImageKit gagal (HTTP ' + res.status + ').'));
                }

                if (data.status !== 'success') {
                    throw new Error(String(data.message || 'Autentikasi ImageKit gagal.'));
                }

                if (!cfg.endpoint && data.endpoint) {
                    document.getElementById('set-ik-end').value = data.endpoint;
                }

                IK_PUB = cfg.publicKey;
                IK_END = data.endpoint || cfg.endpoint;

                const warningText = Array.isArray(data.warnings) && data.warnings.length ? ' ' + data.warnings.join(' ') : '';
                const saveReminder = cfg.privateKey ? ' Klik "Update ImageKit Media Center" untuk menyimpan private key ini ke server.' : '';
                const msg = String(data.message || 'Koneksi ImageKit berhasil.') + warningText + saveReminder;
                setImageKitStatus(msg, Array.isArray(data.warnings) && data.warnings.length ? 'warning' : 'success');
                if (!opts.silent) {
                    showToast(
                        cfg.privateKey
                            ? 'Koneksi ImageKit berhasil diuji. Klik "Update ImageKit Media Center" untuk menyimpan private key.'
                            : 'Koneksi ImageKit berhasil diuji.',
                        'success'
                    );
                }
                return data;
            } catch (error) {
                const msg = error && error.message ? error.message : 'Koneksi ImageKit gagal.';
                setImageKitStatus(msg, 'error');
                if (opts.silent) throw new Error(msg);
                showToast(msg, 'error');
                return null;
            }
        }

        (function() {
            const CACHE_KEY = 'cepat_global_settings';
            const CACHE_AGE = 60 * 60 * 1000;

            function syncGlobalSettingsCache(data, timestamp) {
                if (!data) return;
                const payload = { data: data, time: Number(timestamp || Date.now()) };
                try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (e) {}
                applyGlobalSettings(data);
            }

            function applyGlobalSettings(data) {
                applyBrandFavicon(data.site_favicon, data.site_name);
                if(data.site_name) {
                    document.title = document.title.replace(/Cepat Digital/gi, data.site_name).replace(/Cepat/gi, data.site_name);
                }
                const updateDomElements = () => {
                    if(data.site_name) {
                        document.querySelectorAll('.dyn-site-name').forEach(el => { el.innerText = data.site_name; });
                    }
                    if(data.site_tagline) {
                        document.querySelectorAll('.dyn-site-tagline').forEach(el => { el.innerText = data.site_tagline; });
                    }
                    
                    // LOGO UPDATE LOGIC
                    const logoUrl = data.site_logo;
                    
                    // Login Screen
                    const loginImg = document.getElementById('login-logo-img');
                    const loginIcon = document.getElementById('login-logo-icon');
                    if(loginImg && loginIcon) {
                        applyBrandLogo(loginImg, loginIcon, logoUrl);
                    }

                    // Sidebar
                    const sidebarImg = document.getElementById('sidebar-logo-img');
                    const sidebarIcon = document.getElementById('sidebar-logo-icon');
                    if(sidebarImg && sidebarIcon) {
                        applyBrandLogo(sidebarImg, sidebarIcon, logoUrl);
                    }
                };
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', updateDomElements);
                } else {
                    updateDomElements();
                }
            }

            const cachedStr = localStorage.getItem(CACHE_KEY);
            let cached = null;
            try { cached = JSON.parse(cachedStr); } catch(e){}
            const now = Date.now();

            if (cached && cached.data) { applyGlobalSettings(cached.data); }
            window.__CEPAT_GLOBAL_SETTINGS__ = {
                key: CACHE_KEY,
                maxAge: CACHE_AGE,
                cached: cached,
                isFresh: !!(cached && cached.time && (now - cached.time <= CACHE_AGE)),
                apply: applyGlobalSettings,
                sync: syncGlobalSettingsCache
            };
        })();
    








  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-GZM06L9YDH');



        function updateProdPreview(url) {
            const preview = document.getElementById('p-image-preview');
            const placeholder = document.getElementById('p-image-placeholder');
            if (url && url.length > 10) {
                preview.src = url;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                preview.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        }

        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'check-circle';
            if (type === 'error') icon = 'x-circle';
            if (type === 'warning') icon = 'alert-triangle';
            toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i> <span>${message}</span>`;
            container.appendChild(toast);
            lucide.createIcons({ root: toast });
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }

        function pushAuthTelemetry(entry) {
            try {
                const key = 'cepat_auth_telemetry';
                const prev = JSON.parse(localStorage.getItem(key) || '[]');
                const arr = Array.isArray(prev) ? prev : [];
                arr.push({
                    ts: Date.now(),
                    page: 'admin-area',
                    ...entry
                });
                while (arr.length > 50) arr.shift();
                localStorage.setItem(key, JSON.stringify(arr));
            } catch (e) {}
        }

        function setUnifiedSession(data) {
            const role = String((data && data.role) || 'admin').toLowerCase();
            const name = String((data && data.name) || 'Admin');
            const email = String((data && data.email) || '');
            const id = String((data && data.id) || '');
            const sessionToken = String((data && (data.session_token || data.token)) || '');

            // Unified session contract
            sessionStorage.setItem('auth_v1', 'true');
            sessionStorage.setItem('auth_role', role);
            sessionStorage.setItem('auth_name', name);
            if (email) sessionStorage.setItem('auth_email', email);
            if (id) sessionStorage.setItem('auth_user_id', id);
            if (sessionToken) sessionStorage.setItem('auth_session_token', sessionToken);
            else sessionStorage.removeItem('auth_session_token');
            sessionStorage.removeItem('auth_expires_at');

            // Legacy compatibility for Member Area & CMS
            sessionStorage.setItem('user_email', email);
            sessionStorage.setItem('user_nama', name);
            sessionStorage.setItem('user_id', id);

            // Persist to localStorage for tab persistence
            localStorage.setItem('cepat_user_session', JSON.stringify({
                email: email,
                nama: name,
                id: id,
                isAdmin: role === 'admin',
                token: sessionToken
            }));

            // Backward compatibility (legacy admin keys)
            sessionStorage.setItem('adm_v10', 'true');
            sessionStorage.setItem('adm_name', name);
        }

        function clearAdminSession() {
            sessionStorage.removeItem('auth_v1');
            sessionStorage.removeItem('auth_role');
            sessionStorage.removeItem('auth_name');
            sessionStorage.removeItem('auth_email');
            sessionStorage.removeItem('auth_user_id');
            sessionStorage.removeItem('auth_session_token');
            sessionStorage.removeItem('auth_expires_at');
            sessionStorage.removeItem('adm_v10');
            sessionStorage.removeItem('adm_name');
            
            // Clear legacy & persistent session
            sessionStorage.removeItem('user_email');
            sessionStorage.removeItem('user_nama');
            sessionStorage.removeItem('user_id');
            localStorage.removeItem('cepat_user_session');
        }

        function getAdminSessionMeta() {
            return {
                role: String(sessionStorage.getItem('auth_role') || '').toLowerCase(),
                token: String(sessionStorage.getItem('auth_session_token') || '')
            };
        }

        function getCurrentAdminRole() {
            return getAdminSessionMeta().role;
        }

        function isAdminSessionActive() {
            const session = getAdminSessionMeta();
            const roleAllowed = session.role === 'admin';
            const hasUnifiedSession = sessionStorage.getItem('auth_v1') === 'true' && roleAllowed && !!session.token;
            return hasUnifiedSession;
        }

        function formatAdminNumber(value, suffix = '') {
            return Number(value || 0).toLocaleString('id-ID') + suffix;
        }

        function formatAdminCurrency(value) {
            return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
        }

        function showAdminLoginState(message = '') {
            clearAdminSession();
            localStorage.removeItem(CACHE_KEY_ADMIN);
            if (workerMetricsTimer) {
                clearInterval(workerMetricsTimer);
                workerMetricsTimer = null;
            }
            const adminMain = document.getElementById('admin-main');
            const loginOverlay = document.getElementById('login-overlay');
            if (adminMain) adminMain.style.display = 'none';
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (message) showToast(message, 'warning');
        }

        function ensureAdminSessionActive(showFeedback = true) {
            if (isAdminSessionActive()) return true;
            showAdminLoginState(showFeedback ? 'Sesi admin tidak valid. Silakan login ulang.' : '');
            return false;
        }

        function buildAdminAuthPayload(payload) {
            if (!ensureAdminSessionActive(true)) {
                throw new Error('Sesi admin tidak valid. Silakan login ulang.');
            }
            const session = getAdminSessionMeta();
            return Object.assign({}, payload || {}, {
                auth_session_token: session.token,
                auth_role: session.role
            });
        }

        async function readJsonSafe(res) {
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) { return null; }
        }

        function normalizeAdminData(data) {
            const r = (data && typeof data === 'object') ? data : {};
            const stats = (r.stats && typeof r.stats === 'object') ? r.stats : {};
            const settings = (r.settings && typeof r.settings === 'object') ? r.settings : {};
            const orders = Array.isArray(r.orders) ? r.orders : [];
            const users = Array.isArray(r.users) ? r.users : [];
            const products = Array.isArray(r.products) ? r.products : [];
            const pages = Array.isArray(r.pages) ? r.pages : [];
            return {
                status: r.status,
                message: r.message,
                role: String(r.role || '').toLowerCase(),
                session_expires_at: Number(r.session_expires_at || 0),
                stats: {
                    users: Number(stats.users || 0),
                    orders: Number(stats.orders || 0),
                    rev: Number(stats.rev || 0)
                },
                settings,
                orders,
                users,
                products,
                pages,
                has_more_orders: !!r.has_more_orders,
                has_more_users: !!r.has_more_users
            };
        }

        function getApiEndpoint() {
            try {
                if (window.API_URL) return window.API_URL;
                const host = location.hostname;
                if (location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1') {
                    return (typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : null;
                }
                return '/api';
            } catch (e) {
                return window.API_URL || ((typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : '/api');
            }
        }

        function customConfirm(msg) {
            return new Promise((resolve) => {
                const modal = document.getElementById('modal-confirm');
                const content = document.getElementById('modal-confirm-content');
                document.getElementById('confirm-msg').innerText = msg;
                
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                void modal.offsetWidth;
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');

                const btnOk = document.getElementById('btn-confirm-ok');
                const btnCancel = document.getElementById('btn-confirm-cancel');

                const cleanup = () => {
                    modal.classList.add('opacity-0');
                    content.classList.add('scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                    }, 300);
                    btnOk.removeEventListener('click', onOk);
                    btnCancel.removeEventListener('click', onCancel);
                };

                const onOk = () => { cleanup(); resolve(true); };
                const onCancel = () => { cleanup(); resolve(false); };

                btnOk.addEventListener('click', onOk);
                btnCancel.addEventListener('click', onCancel);
            });
        }

        const CACHE_KEY_ADMIN = 'melimpah_admin_data';
        const PRODUCT_DESC_MAX_LENGTH = 280;
        let MOOTA_URL = ''; let MOOTA_TOKEN_CONFIGURED = false;
        let IK_PUB = ''; let IK_END = ''; let IK_PRIVATE_CONFIGURED = false; let cachedPages = []; let cachedProducts = [];
        let workerMetricsTimer = null;

        function normalizePlainText(value) {
            return String(value == null ? '' : value)
                .replace(/\r\n?/g, '\n')
                .replace(/\u00A0/g, ' ')
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function normalizeProductDescriptionInput(value) {
            return normalizePlainText(value);
        }

        function containsHtmlLikeMarkup(value) {
            return /<\s*\/?\s*[a-z][^>]*>/i.test(String(value == null ? '' : value));
        }

        function validateProductDescriptionInput(value) {
            const raw = String(value == null ? '' : value);
            const normalized = normalizeProductDescriptionInput(raw);
            const errors = [];
            if (containsHtmlLikeMarkup(raw)) {
                errors.push('Deskripsi singkat produk tidak boleh mengandung tag HTML.');
            }
            if (normalized.length > PRODUCT_DESC_MAX_LENGTH) {
                errors.push(`Deskripsi singkat produk maksimal ${PRODUCT_DESC_MAX_LENGTH} karakter.`);
            }
            return { value: normalized, errors };
        }

        function updateProductDescriptionCounter(value) {
            const counter = document.getElementById('p-desc-counter');
            if (!counter) return;
            const length = normalizeProductDescriptionInput(value).length;
            counter.textContent = `${length}/${PRODUCT_DESC_MAX_LENGTH}`;
            counter.className = `text-[11px] font-bold ${length > PRODUCT_DESC_MAX_LENGTH ? 'text-red-500' : 'text-slate-400'}`;
        }

        function escapeHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function toggleSidebar() {
            const sb = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            sb.classList.toggle('open');
            overlay.classList.toggle('open');
        }

        function togglePass() {
            const p = document.getElementById('adm-pass'); const icon = document.getElementById('eye-icon');
            if (p.type === 'password') { p.type = 'text'; icon.setAttribute('data-lucide', 'eye-off'); } 
            else { p.type = 'password'; icon.setAttribute('data-lucide', 'eye'); }
            lucide.createIcons();
        }

        function toggleForgotPasswordModal(forceOpen) {
            const modal = document.getElementById('modal-forgot-admin');
            const trigger = document.getElementById('btn-forgot-open-admin');
            if (!modal) return;
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : modal.classList.contains('hidden');

            modal.classList.toggle('hidden', !shouldOpen);
            modal.classList.toggle('flex', shouldOpen);
            if (trigger) {
                trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            }

            if (shouldOpen) {
                const loginEmail = document.getElementById('adm-email');
                const forgotEmail = document.getElementById('adm-email-forgot');
                if (forgotEmail && !forgotEmail.value && loginEmail && loginEmail.value) {
                    forgotEmail.value = loginEmail.value;
                }
                setTimeout(() => {
                    const focusInput = document.getElementById('adm-email-forgot');
                    if (focusInput) focusInput.focus();
                }, 0);
            }
        }

        function getLoginEndpoints() {
            const primaryEndpoint = getApiEndpoint();
            const scriptFallback = (typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : null;
            return [primaryEndpoint, scriptFallback]
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i);
        }

        const forgotPasswordToolkit = (typeof window !== 'undefined' && window.AdminForgotPassword)
            ? window.AdminForgotPassword
            : null;

        function bindForgotPasswordTrigger() {
            const trigger = document.getElementById('btn-forgot-open-admin');
            if (!trigger) return false;
            if (forgotPasswordToolkit && typeof forgotPasswordToolkit.bindForgotPasswordTrigger === 'function') {
                return forgotPasswordToolkit.bindForgotPasswordTrigger({
                    trigger,
                    onOpen: () => toggleForgotPasswordModal(true)
                });
            }
            if (trigger.dataset.boundForgotTrigger === '1') return true;

            const onTriggerClick = (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                toggleForgotPasswordModal(true);
            };

            trigger.addEventListener('click', onTriggerClick, true);
            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    onTriggerClick(event);
                }
            });
            trigger.dataset.boundForgotTrigger = '1';
            return true;
        }

        if (!bindForgotPasswordTrigger()) {
            document.addEventListener('DOMContentLoaded', bindForgotPasswordTrigger, { once: true });
        }
        window.addEventListener('pageshow', bindForgotPasswordTrigger);

        const forgotModalAdmin = document.getElementById('modal-forgot-admin');
        if (forgotModalAdmin) {
            forgotModalAdmin.addEventListener('click', (event) => {
                if (event.target === forgotModalAdmin) toggleForgotPasswordModal(false);
            });
        }

        async function loginRequest(endpoint, payload) {
            const ep = String(endpoint || '');
            // Penting: jangan paksa Content-Type application/json untuk fallback ke GAS
            // agar tidak memicu preflight CORS yang bisa gagal di script.google.com.
            const isGAS = ep.indexOf('script.google.com/macros/') !== -1;
            const requestId = 'adm_' + Date.now() + '_' + Math.random().toString(16).slice(2);
            const reqInit = {
                method: 'POST',
                body: JSON.stringify(payload)
            };
            if (!isGAS) {
                reqInit.headers = {
                    'Content-Type': 'application/json',
                    'X-Request-Id': requestId
                };
            }
            const startedAt = Date.now();
            const res = await fetch(endpoint, reqInit);

            const rawText = await res.text();
            let parsed = null;
            try { parsed = JSON.parse(rawText); } catch (_) {}

            // Selalu lempar error jika format tidak valid agar bisa fallback endpoint
            if (!parsed || typeof parsed !== 'object') {
                const safePreview = String(rawText || '')
                    .replace(/[^\x20-\x7E]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .slice(0, 180);
                const err = new Error(`Invalid response dari ${endpoint} (HTTP ${res.status}) ${safePreview ? '- ' + safePreview : ''}`);
                err.code = 'INVALID_RESPONSE';
                err.httpStatus = res.status;
                err.telemetry = {
                    endpoint,
                    requestId,
                    durationMs: Date.now() - startedAt,
                    httpStatus: res.status,
                    parseOk: false,
                    apiContract: res.headers.get('X-Api-Contract') || '',
                    contentType: res.headers.get('Content-Type') || '',
                    contentEncoding: res.headers.get('Content-Encoding') || ''
                };
                throw err;
            }

            return {
                data: parsed,
                telemetry: {
                    endpoint,
                    requestId,
                    durationMs: Date.now() - startedAt,
                    httpStatus: res.status,
                    parseOk: true,
                    apiContract: res.headers.get('X-Api-Contract') || '',
                    contentType: res.headers.get('Content-Type') || '',
                    contentEncoding: res.headers.get('Content-Encoding') || ''
                }
            };
        }

        document.getElementById('form-login').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = document.getElementById('btn-login'); const oriText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto"></i>'; 
            btn.disabled = true; lucide.createIcons();
            try { 
                const payload = { action: 'admin_login', email: document.getElementById('adm-email').value, password: document.getElementById('adm-pass').value };

                const endpoints = getLoginEndpoints();

                if (!endpoints.length) throw new Error("Config.js tidak terpanggil!");

                let r = null;
                let lastErr = null;
                for (const endpoint of endpoints) {
                    try {
                        const out = await loginRequest(endpoint, payload);
                        r = out.data;
                        pushAuthTelemetry({
                            stage: 'login_attempt',
                            outcome: 'success-response',
                            ...out.telemetry
                        });
                        break;
                    } catch (err) {
                        lastErr = err;
                        pushAuthTelemetry({
                            stage: 'login_attempt',
                            outcome: 'error-response',
                            endpoint,
                            message: String(err && err.message ? err.message : err),
                            ...(err && err.telemetry ? err.telemetry : {})
                        });
                        // Coba endpoint berikutnya (mis. /api gagal parse, fallback ke SCRIPT_URL)
                    }
                }

                if (!r) throw (lastErr || new Error('Gagal terhubung ke server login.'));

                if(r.status === 'success') { 
                    const info = r.data && typeof r.data === 'object' ? r.data : {};
                    const nama = info.nama || '';
                    localStorage.removeItem(CACHE_KEY_ADMIN);
                    setUnifiedSession({
                        id: String(info.id || ''),
                        role: String(info.role || 'admin'),
                        name: String(nama || 'Admin'),
                        email: String(info.email || document.getElementById('adm-email').value || ''),
                        session_token: String(info.session_token || ''),
                        expires_at: Number(info.expires_at || 0)
                    });
                    showToast('Berhasil Login!', 'success');
                    init(); 
                } else { 
                    showToast(String(r.message || 'Email atau password salah'), 'error'); 
                } 
            } catch (err) { 
                showToast(String((err && err.message) ? err.message : 'Error Koneksi!'), 'error'); 
            } finally {
                btn.innerHTML = oriText; 
                btn.disabled = false; 
                lucide.createIcons();
            }
        };

        const forgotFormAdmin = document.getElementById('form-forgot-admin');
        if (forgotFormAdmin) {
            const localForgotPasswordSubmit = async (event) => {
                event.preventDefault();
                const btn = document.getElementById('btn-forgot-admin');
                const emailInput = document.getElementById('adm-email-forgot');
                const email = String(emailInput && emailInput.value ? emailInput.value : '').trim();
                if (!email) {
                    showToast('Email wajib diisi.', 'error');
                    return;
                }

                const oriText = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Mengirim...';
                btn.disabled = true;
                lucide.createIcons();

                try {
                    const payload = { action: 'forgot_password', email };
                    const endpoints = getLoginEndpoints();
                    if (!endpoints.length) throw new Error('Config.js tidak terpanggil!');

                    let r = null;
                    let lastErr = null;
                    for (const endpoint of endpoints) {
                        try {
                            const out = await loginRequest(endpoint, payload);
                            r = out.data;
                            pushAuthTelemetry({
                                stage: 'forgot_password_attempt',
                                outcome: 'success-response',
                                ...out.telemetry
                            });
                            break;
                        } catch (err) {
                            lastErr = err;
                            pushAuthTelemetry({
                                stage: 'forgot_password_attempt',
                                outcome: 'error-response',
                                endpoint,
                                message: String(err && err.message ? err.message : err),
                                ...(err && err.telemetry ? err.telemetry : {})
                            });
                        }
                    }

                    if (!r) throw (lastErr || new Error('Gagal terhubung ke server.'));

                    if (r.status === 'success') {
                        showToast(String(r.message || 'Password telah dikirim ke email anda.'), 'success');
                        forgotFormAdmin.reset();
                        toggleForgotPasswordModal(false);
                    } else {
                        showToast(String(r.message || 'Email tidak ditemukan.'), 'error');
                    }
                } catch (err) {
                    showToast(String((err && err.message) ? err.message : 'Error Koneksi!'), 'error');
                } finally {
                    btn.innerHTML = oriText;
                    btn.disabled = false;
                    lucide.createIcons();
                }
            };

            forgotFormAdmin.onsubmit = localForgotPasswordSubmit;
            if (forgotPasswordToolkit && typeof forgotPasswordToolkit.createSubmitHandler === 'function') {
                forgotFormAdmin.onsubmit = forgotPasswordToolkit.createSubmitHandler({
                    form: forgotFormAdmin,
                    button: document.getElementById('btn-forgot-admin'),
                    emailInput: document.getElementById('adm-email-forgot'),
                    getEndpoints: getLoginEndpoints,
                    loginRequest,
                    pushAuthTelemetry,
                    showToast,
                    closeModal: () => toggleForgotPasswordModal(false),
                    refreshIcons: () => lucide.createIcons()
                });
            }
        }

        let currentOrderPage = 1;
        let currentUserPage = 1;

        function renderMembers(members, append = false) {
            const list = document.getElementById('list-members').getElementsByTagName('tbody')[0];
            if(!append) list.innerHTML = '';
            members.forEach(m => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-[rgba(255,255,255,0.05)] transition-colors';
                row.innerHTML = `
                    <td class="px-8 py-5 font-mono font-bold text-[#B6FF00] text-xs">${m[0]}</td>
                    <td class="px-8 py-5">
                        <p class="font-bold text-white text-sm">${m[3]}</p>
                    </td>
                    <td class="px-8 py-5 text-sm text-slate-400">${m[1]}</td>
                    <td class="px-8 py-5 text-sm text-slate-400">${m[4]}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1.5 bg-[rgba(182,255,0,0.1)] text-[#B6FF00] border border-[rgba(182,255,0,0.2)] rounded-full text-xs font-bold">${m[5]}</span>
                    </td>
                    <td class="px-8 py-5 text-sm text-slate-400">${m[6]}</td>
                `;
                list.appendChild(row);
            });
        }

        function renderOrders(orders, append = false) {
            const list = document.getElementById('list-orders');
            const html = orders.map(o => {
                if (!o || !Array.isArray(o)) return '';
                const inv = o[0] || '-';
                const email = o[1] || '-';
                const name = o[2] || '-';
                const pname = o[5] || '-';
                const status = String(o[7] || '').trim();
                const statusLower = status.toLowerCase();
                let bgColor, textColor, borderColor;
                if (statusLower === 'lunas') {
                    bgColor = 'rgba(16,185,129,0.15)'; textColor = '#34d399'; borderColor = 'rgba(16,185,129,0.3)';
                } else if (statusLower === 'pending') {
                    bgColor = 'rgba(245,158,11,0.15)'; textColor = '#fbbf24'; borderColor = 'rgba(245,158,11,0.3)';
                } else if (statusLower === 'batal' || statusLower === 'failed') {
                    bgColor = 'rgba(244,63,94,0.15)'; textColor = '#fb7185'; borderColor = 'rgba(244,63,94,0.3)';
                } else {
                    bgColor = 'rgba(100,116,139,0.1)'; textColor = '#94a3b8'; borderColor = 'rgba(100,116,139,0.2)';
                }

                return `
                <tr class="hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[rgba(255,255,255,0.05)] last:border-0 group">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-[#B6FF00]" data-label="Invoice">${inv}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400" data-label="Tanggal">
                        <div>${o[8] ? new Date(o[8]).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white" data-label="Pelanggan">
                        <div class="flex flex-col">
                            <div class="font-bold">${name}</div>
                            <div class="text-[11px] text-slate-400 mt-1">${email}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-300 md:whitespace-nowrap" data-label="Produk"><div class="whitespace-normal break-words leading-relaxed">${pname}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-mono font-bold" data-label="Total">
                        <div>Rp ${Number(o[6] || 0).toLocaleString('id-ID')}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap" data-label="Status">
                        <div>
                        <span class="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style="background-color: ${bgColor}; color: ${textColor}; border-color: ${borderColor};">
                            ${status}
                        </span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Aksi">
                        <div class="flex gap-2">
                            ${statusLower==='pending'
                                ? `<button onclick="setLunas('${o[0]}')" class="text-[#B6FF00] border border-[rgba(182,255,0,0.2)] bg-[rgba(182,255,0,0.1)] font-bold uppercase text-[10px] hover:bg-[rgba(182,255,0,0.2)] px-3 py-1.5 rounded-lg transition-colors">Aktifkan</button>`
                                : (statusLower==='lunas'
                                    ? `<button onclick="setPending('${o[0]}')" class="text-[#ef4444] border border-[#ef4444]/20 bg-[#ef4444]/10 font-bold uppercase text-[10px] hover:bg-[#ef4444]/20 px-3 py-1.5 rounded-lg transition-colors">Non Aktifkan</button>`
                                    : '-')}
                        </div>
                    </td>
                </tr>`;
            }).join('');

            if(append) list.insertAdjacentHTML('beforeend', html);
            else list.innerHTML = html;
        }

        async function loadMoreOrders() {
            const btn = document.getElementById('btn-more-orders');
            const oriText = btn.innerText;
            btn.innerText = 'Loading...'; btn.disabled = true;
            try {
                currentOrderPage++;
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_admin_orders', page: currentOrderPage, limit: 20 })) 
                });
                const r = await res.json();
                if(r.status === 'success') {
                    renderOrders(r.data, true);
                    document.getElementById('more-orders-container').classList.toggle('hidden', !r.has_more);
                }
            } catch(e) { console.error(e); }
            btn.innerText = oriText; btn.disabled = false;
        }

        async function loadMoreMembers() {
            const btn = document.getElementById('btn-more-members');
            const oriText = btn.innerText;
            btn.innerText = 'Loading...'; btn.disabled = true;
            try {
                currentUserPage++;
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_admin_users', page: currentUserPage, limit: 20 })) 
                });
                const r = await res.json();
                if(r.status === 'success') {
                    renderMembers(r.data, true);
                    document.getElementById('more-members-container').classList.toggle('hidden', !r.has_more);
                }
            } catch(e) { console.error(e); }
            btn.innerText = oriText; btn.disabled = false;
        }

        function renderAdminUI(r) {
            r = normalizeAdminData(r);
            currentOrderPage = 1;
            currentUserPage = 1;
            renderMembers(r.users || []);
            renderOrders(r.orders || []);

            document.getElementById('more-orders-container').classList.toggle('hidden', !r.has_more_orders);
            document.getElementById('more-members-container').classList.toggle('hidden', !r.has_more_users);

            cachedPages = r.pages || [];
            cachedProducts = r.products || [];
            document.getElementById('stat-orders').innerText = formatAdminNumber(r.stats.orders);
            document.getElementById('stat-rev').innerText = formatAdminCurrency(r.stats.rev);
            const stMembers = document.getElementById('stat-members'); if(stMembers) stMembers.innerText = formatAdminNumber(r.stats.users);
            document.getElementById('count-prod').innerText = cachedProducts.length;

            document.getElementById('list-products').innerHTML = [...cachedProducts].reverse().map(p => {
                const isAct = String(p[5]).trim() === 'Active';
                const isHiddenProd = p[15] === true || String(p[15]).toUpperCase() === 'TRUE';
                const stCls = isAct ? 'bg-[rgba(1,122,107,0.2)] text-[#017A6B] border-[rgba(1,122,107,0.4)]' : 'bg-[rgba(255,255,255,0.05)] text-slate-400 border-[rgba(255,255,255,0.1)]';
                const displayPrice = Number(p[4] || 0).toLocaleString('id-ID');
                const productImage = p[7] || '';
                const safeProductId = escapeHtml(normalizePlainText(p[0]) || '-');
                const safeProductStatus = escapeHtml(normalizePlainText(p[5]) || '-');
                const safeProductTitle = escapeHtml(normalizePlainText(p[1]) || '-');
                const safeProductDesc = escapeHtml(normalizeProductDescriptionInput(p[2]) || '-');
                // Build checkout URL (strip /admin-area path)
                const _basePath = location.pathname.replace(/\/?admin-area(\.html)?\s*$/i, '').replace(/\/?$/, '/');
                const copyUrl = location.origin + _basePath + 'checkout.html?id=' + p[0];
                return `
                <div class="glass-card p-6 rounded-3xl border ${isHiddenProd ? 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.02)]' : 'border-[rgba(255,255,255,0.05)]'} shadow-none hover:shadow-[0_0_30px_rgba(1,122,107,0.2)] hover:-translate-y-1 transition-all duration-300 group relative">
                    ${isHiddenProd ? '<div class="absolute inset-0 pointer-events-none rounded-3xl" style="background:rgba(239,68,68,0.03);"></div>' : ''}
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex flex-col gap-2">
                            <span class="text-[10px] font-bold bg-[rgba(0,0,0,0.3)] text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-wider w-fit group-hover:bg-[rgba(182,255,0,0.1)] group-hover:text-[#B6FF00] transition-colors">${safeProductId}</span>
                            <span class="text-[10px] font-bold ${stCls} px-3 py-1.5 rounded-full uppercase tracking-wider border w-fit flex items-center gap-1">
                                <i data-lucide="${isAct ? 'check-circle-2' : 'minus-circle'}" class="w-3 h-3"></i> ${safeProductStatus}
                            </span>
                            ${isHiddenProd ? '<span class="text-[10px] font-bold bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] px-3 py-1.5 rounded-full uppercase tracking-wider w-fit flex items-center gap-1"><i data-lucide="eye-off" class="w-3 h-3"></i> Tersembunyi</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-right">
                                ${Number(p[14] || 0) > 0 && Number(p[14] || 0) > Number(p[4] || 0) ? `<span class="text-xs line-through text-slate-500">Rp ${Number(p[14]).toLocaleString('id-ID')}</span>` : ''}
                                <span class="text-sm font-bold text-white block">Rp ${displayPrice}</span>
                                ${(function() { const hCoret = Number(p[14]||0); const harga = Number(p[4]||0); if(hCoret > 0 && hCoret > harga) { const pct = Math.round((1-harga/hCoret)*100); return `<span class="text-[10px] font-bold text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] px-1.5 py-0.5 rounded-full">-${pct}%</span>`; } return ''; })()}
                            </div>
                            <button onclick="copyProductLink('${copyUrl}')" class="p-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:text-[#B6FF00] hover:bg-[rgba(182,255,0,0.1)] hover:border-[rgba(182,255,0,0.3)] transition-all" title="Copy Link Checkout"><i data-lucide="link" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                    ${productImage ? `<div class="w-full aspect-square rounded-2xl overflow-hidden mb-4 border border-[rgba(255,255,255,0.05)]"><img src="${productImage}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" onerror="this.style.display='none'" loading="lazy" decoding="async"></div>` : ''}
                    <h4 class="font-bold text-white text-lg mb-2 leading-snug">${safeProductTitle}</h4>
                    <p class="text-xs text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">${safeProductDesc}</p>
                    <div class="flex gap-2">
                        <button onclick="editProd('${p[0]}')" class="flex-1 btn-primary py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all">Edit Produk</button>
                        <button onclick="deleteProd('${p[0]}', '${String(p[1] || '').replace(/'/g, "\\'")}')" class="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:border-transparent hover:bg-[#ef4444] hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] px-4 py-3.5 rounded-xl font-bold transition-all" title="Hapus Produk"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>`;
            }).join('');

            // Populate protect dropdown with current products
            (function(){
                const sel = document.getElementById('pg-protected-product');
                if (!sel) return;
                const currentVal = sel.value;
                sel.innerHTML = '<option value="" style="background: #0f172a; color: #94a3b8;">-- Tidak Diproteksi (Akses Bebas) --</option>';
                (cachedProducts || []).forEach(function(prod) {
                    const pid = String(prod[0] || '').trim();
                    const ptitle = String(prod[1] || '').trim();
                    if (!pid) return;
                    const opt = document.createElement('option');
                    opt.value = pid;
                    opt.textContent = ptitle + ' (' + pid + ')';
                    opt.style.background = '#0f172a';
                    opt.style.color = '#f1f5f9';
                    sel.appendChild(opt);
                });
                if (currentVal) sel.value = currentVal;
            })();

            document.getElementById('list-pages').innerHTML = cachedPages.map(p => {
                const isProtected = String(p[11] || '').trim();
                const protectBadge = isProtected
                    ? `<span class="inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full border border-slate-600/60 bg-slate-800/50 text-slate-400 flex-shrink-0" title="Protected Page"><i data-lucide="lock" class="w-3 h-3"></i></span>`
                    : '';
                return `
                <tr class="hover:bg-[rgba(255,255,255,0.05)] transition-colors border-b border-[rgba(255,255,255,0.05)] last:border-0">
                    <td class="px-8 py-5">
                        <div class="flex items-center min-w-0 max-w-[200px] md:max-w-xs">
                            ${protectBadge}
                            <span class="font-bold text-white truncate text-sm flex-1">${p[2]}</span>
                        </div>
                    </td>
                    <td class="px-8 py-5">
                        <a href="p.html?s=${p[1]}" target="_blank" class="font-mono text-[#B6FF00] hover:underline text-xs bg-[rgba(182,255,0,0.1)] border border-[rgba(182,255,0,0.2)] px-2 py-1 rounded">/p.html?s=${p[1]}</a>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="downloadPageHTML('${p[0]}')" class="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:bg-[#017A6B]/20 hover:text-[#B6FF00] hover:border-[#B6FF00]/50 hover:shadow-[0_0_15px_rgba(1,122,107,0.4)] transition-colors p-2 rounded-xl" title="Download HTML"><i data-lucide="download" class="w-4 h-4"></i></button>
                            <button onclick="editPage('${p[0]}')" class="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-slate-400 hover:bg-[#B6FF00] hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(182,255,0,0.4)] transition-colors px-4 py-2 rounded-xl font-bold text-xs">Edit</button>
                            <button onclick="deletePage('${p[0]}', '${String(p[2] || '').replace(/'/g, "\\'")}')" class="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:border-transparent hover:bg-[#ef4444] hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] px-4 py-2 rounded-xl font-bold transition-all" title="Hapus Halaman"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                </tr>`;}).join('');

            document.getElementById('set-site-name').value = r.settings.site_name || '';
            document.getElementById('set-site-tagline').value = r.settings.site_tagline || '';
            document.getElementById('set-logo').value = r.settings.site_logo || '';
            document.getElementById('set-favicon').value = r.settings.site_favicon || '';
            document.getElementById('set-wa').value = r.settings.wa_admin || '';

            document.getElementById('set-email').value = r.settings.contact_email || '';
            document.getElementById('set-fonnte').value = r.settings.fonnte_token || '';
            document.getElementById('set-moota-url').value = MOOTA_URL = r.settings.moota_gas_url || '';
            document.getElementById('set-moota-token').value = '';
            updateMootaHints(!!r.settings.moota_token_configured);
            document.getElementById('moota-test-status').classList.add('hidden');
            document.getElementById('set-ik-pub').value = IK_PUB = r.settings.ik_public_key || '';
            document.getElementById('set-ik-end').value = IK_END = r.settings.ik_endpoint || '';
            document.getElementById('set-ik-priv').value = '';
            updateImageKitPrivateHint(!!r.settings.ik_private_key_configured);
            document.getElementById('ik-test-status').classList.add('hidden');
            document.getElementById('set-cf-zone').value = r.settings.cf_zone_id || '';
            document.getElementById('set-cf-token').value = r.settings.cf_api_token || '';
            if (window.__CEPAT_GLOBAL_SETTINGS__ && typeof window.__CEPAT_GLOBAL_SETTINGS__.sync === 'function') {
                window.__CEPAT_GLOBAL_SETTINGS__.sync({
                    site_name: r.settings.site_name || '',
                    site_tagline: r.settings.site_tagline || '',
                    site_logo: r.settings.site_logo || '',
                    site_favicon: r.settings.site_favicon || ''
                }, Date.now());
            }
            document.getElementById('admin-role-note').innerText = 'Master Control';
            renderClientFetchStats();
            lucide.createIcons();
            fetchAndRenderSalesChartData();
        }

        async function init() {
            if(!isAdminSessionActive()) return;
            document.getElementById('login-overlay').style.display = 'none'; 
            document.getElementById('admin-main').style.display = 'flex'; 
            document.getElementById('admin-name').innerText = sessionStorage.getItem('auth_name') || sessionStorage.getItem('adm_name') || 'Admin';
            ensureWorkerMetricsPolling();
            
            const cachedDataStr = localStorage.getItem(CACHE_KEY_ADMIN); 
            const syncLabel = document.getElementById('sync-status');
            
            if (cachedDataStr) { 
                try {
                    const parsed = JSON.parse(cachedDataStr);
                    const normalized = normalizeAdminData(parsed);
                    const looksValid = normalized && typeof normalized === 'object' && normalized.settings && typeof normalized.settings === 'object';
                    if (looksValid) renderAdminUI(normalized);
                    else localStorage.removeItem(CACHE_KEY_ADMIN);
                } catch(e) { localStorage.removeItem(CACHE_KEY_ADMIN); }
                // Show syncing indicator initially if we have cache, 
                // but we'll hide it in finally block
                syncLabel.classList.remove('hidden');
            }
            
            try { 
                const endpoint = getApiEndpoint();
                if(!endpoint) return;
                
                // Add timeout for better UX
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_admin_data' })),
                    signal: controller.signal
                }); 
                clearTimeout(timeoutId);

                const raw = await readJsonSafe(res);
                const r = normalizeAdminData(raw);
                if(r.status === 'success') { 
                    const freshDataStr = JSON.stringify(raw);
                    if(cachedDataStr !== freshDataStr) {
                        localStorage.setItem(CACHE_KEY_ADMIN, freshDataStr); 
                        renderAdminUI(r); 
                    }
                } 
            } catch (err) { 
                console.error("Sync error:", err); 
            } finally {
                // Ensure sync label is always hidden after attempt
                syncLabel.classList.add('hidden');
            }
        }

        function forceSync() { 
            if (!ensureAdminSessionActive(true)) return;
            localStorage.removeItem(CACHE_KEY_ADMIN); 
            document.getElementById('sync-status').classList.remove('hidden'); 
            document.getElementById('sync-status').innerText = 'Refreshing...'; 
            init(); 
        }

        async function triggerPurgeCache() {
            const btn = document.getElementById('btn-purge'); const oriText = btn.innerHTML;
            const zoneId = document.getElementById('set-cf-zone').value.trim();
            const apiToken = document.getElementById('set-cf-token').value.trim();

            if (!zoneId || !apiToken) {
                showToast('Zone ID dan API Token wajib diisi!', 'warning');
                return;
            }

            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> PROSES...'; btn.disabled = true; lucide.createIcons();
            try { 
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                // Kirim credentials juga di payload untuk memastikan data terbaru yang dipakai
                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ 
                        action: 'purge_cf_cache',
                        cf_zone_id: zoneId,
                        cf_api_token: apiToken
                    })) 
                }); 
                const r = await res.json(); 
                showToast(r.message, r.status === 'success' ? 'success' : 'error'); 
            } catch (e) { 
                showToast('Gagal menghubungi server GAS.', 'error'); 
            }
            btn.innerHTML = oriText; btn.disabled = false; lucide.createIcons();
        }

        function downloadPageHTML(id = null) {
            let content = '', filename = 'landing-page.html';
            let pixelId = '', pixelToken = '', pixelTest = '';
            
            if (id) {
                // Dari List Pages
                const p = cachedPages.find(x => x[0] === id);
                if (!p) return showToast('Data halaman tidak ditemukan', 'error');
                content = p[3];
                pixelId = p[7];
                filename = (p[1] || 'landing-page') + '.html';
            } else {
                // Dari Modal Editor
                content = document.getElementById('pg-content').value;
                pixelId = document.getElementById('pg-pixel-id').value;
                const slug = document.getElementById('pg-slug').value;
                filename = (slug || 'landing-page') + '.html';
            }

            if (!content) return showToast('Konten HTML kosong!', 'warning');
            
            // Inject Meta Pixel
            if (pixelId) {
                const pixelScript = `
<!-- Meta Pixel Code -->



!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
<\/script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
`;
                if (content.includes('</head>')) {
                    content = content.replace('</head>', pixelScript + '</head>');
                } else {
                    content = pixelScript + content;
                }
            }

            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('HTML berhasil diunduh!', 'success');
        }

        function editProd(id) { 
            const p = cachedProducts.find(x => x[0] === id); 
            if(!p) return; 
            
            const idInput = document.getElementById('p-id');
            idInput.value = p[0]; 
            idInput.readOnly = true;
            idInput.classList.add('opacity-60', 'cursor-not-allowed');
            idInput.classList.remove('focus:border-[#B6FF00]');

            document.getElementById('p-title').value = p[1]; 
            document.getElementById('p-desc').value = normalizeProductDescriptionInput(p[2]); 
            updateProductDescriptionCounter(document.getElementById('p-desc').value);
            document.getElementById('p-url').value = p[3]; 
            document.getElementById('p-category').value = p[12] || '';
            document.getElementById('p-rekomendasi').checked = p[13] === true || String(p[13]).toUpperCase() === 'TRUE';
            document.getElementById('p-hidden') && (document.getElementById('p-hidden').checked = p[15] === true || String(p[15]).toUpperCase() === 'TRUE');
            const inactiveEl = document.getElementById('p-inactive');
            if (inactiveEl) inactiveEl.checked = String(p[5]).trim() !== 'Active';
            document.getElementById('p-harga').value = p[4];
            // Trigger discount preview update after setting both harga and harga_coret
            const hargaCoretVal = p[14] || '';
            document.getElementById('p-harga-coret').value = hargaCoretVal;
            document.getElementById('p-commission').value = p[11] || 0;
            updateDiscountPreview();
            updateCommissionPreview();
            document.getElementById('p-lp').value = p[6] || ""; 
            const imgUrl = p[7] || "";
            document.getElementById('p-image').value = imgUrl;
            updateProdPreview(imgUrl);
            
            // Meta Pixel
            document.getElementById('p-pixel-id').value = p[8] || '';
            document.getElementById('p-pixel-token').value = p[9] || '';
            document.getElementById('p-pixel-test').value = p[10] || '';

            document.getElementById('p-is-edit').value = 'true'; 
            (function(m){ m.classList.remove('hidden'); m.classList.add('flex'); })(document.getElementById('modal-prod')); 
        }

        async function deleteProd(id, name) {
            const confirmed = await customConfirm(`Hapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`);
            if(!confirmed) return;

            showToast('Menghapus produk...', 'warning');
            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'delete_product', id: id }))
                });
                const r = await res.json();
                if(r.status === 'success') {
                    syncPublicCacheStateFromPayload(r);
                    showToast('Produk berhasil dihapus!', 'success');
                    forceSync();
                } else {
                    showToast(r.message, 'error');
                }
            } catch(e) {
                showToast('Gagal menghapus produk: ' + e.toString(), 'error');
            }
        }

        async function deletePage(id, name) {
            const confirmed = await customConfirm(`Hapus halaman "${name}"? Tindakan ini tidak dapat dibatalkan.`);
            if(!confirmed) return;

            showToast('Menghapus halaman...', 'warning');
            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'delete_page', id: id }))
                });
                const r = await res.json();
                if(r.status === 'success') {
                    syncPublicCacheStateFromPayload(r);
                    showToast('Halaman berhasil dihapus!', 'success');
                    forceSync();
                } else {
                    showToast(r.message, 'error');
                }
            } catch(e) {
                showToast('Gagal menghapus halaman: ' + e.toString(), 'error');
            }
        }

        function editPage(id) { 
            const p = cachedPages.find(x => x[0] === id); 
            if(!p) return; 
            document.getElementById('pg-id').value = p[0]; 
            document.getElementById('pg-slug').value = p[1]; 
            document.getElementById('pg-title').value = p[2]; 
            document.getElementById('pg-content').value = p[3];
            
            // Meta Pixel
            document.getElementById('pg-pixel-id').value = p[7] || '';
            document.getElementById('pg-pixel-token').value = p[8] || '';
            document.getElementById('pg-pixel-test').value = p[9] || '';

            // Protect: set dropdown value
            const sel = document.getElementById('pg-protected-product');
            if (sel) sel.value = String(p[11] || '').trim();
            
            document.getElementById('pg-is-edit').value = 'true'; 
            document.getElementById('modal-page').classList.remove('hidden'); 
        }
        
        async function loadMediaFiles() {
            const gallery = document.getElementById('media-gallery');
            gallery.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400 text-sm italic"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Loading media...</div>';
            lucide.createIcons();

            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_media_files' }))
                });
                const r = await res.json();

                if(r.status === 'success' && r.files && r.files.length > 0) {
                    gallery.innerHTML = r.files.map(f => `
                        <div class="group relative glass-card rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-none overflow-hidden hover:shadow-[0_0_20px_rgba(182,255,0,0.1)] transition-all">
                            <div class="aspect-square w-full overflow-hidden bg-[rgba(0,0,0,0.3)] relative">
                                <img src="${f.thumbnail}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onclick="copyToClipboard('${f.url}')" class="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white p-2 rounded-lg hover:bg-[#B6FF00] hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(182,255,0,0.4)] transition-colors" title="Copy URL">
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                    <a href="${f.url}" target="_blank" class="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white p-2 rounded-lg hover:bg-[#017A6B] hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(1,122,107,0.4)] transition-colors" title="View">
                                        <i data-lucide="external-link" class="w-4 h-4"></i>
                                    </a>
                                </div>
                            </div>
                            <div class="p-3 border-t border-[rgba(255,255,255,0.05)]">
                                <p class="text-[10px] text-slate-400 truncate font-mono">${f.name}</p>
                            </div>
                        </div>
                    `).join('');
                    lucide.createIcons();
                } else if (r.status === 'success') {
                    gallery.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400 text-sm italic">Belum ada file yang diupload.</div>';
                } else {
                    gallery.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 text-sm italic">${r.message || 'Gagal memuat data media.'}</div>`;
                }
            } catch(e) {
                gallery.innerHTML = `<div class="col-span-full text-center py-10 text-red-400 text-sm italic">Gagal memuat data: ${e.message || e.toString()}</div>`;
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => showToast('URL berhasil dicopy!', 'success'));
        }

        function copyProductLink(url) {
            navigator.clipboard.writeText(url).then(() => {
                showToast('URL Produk berhasil dicopy!', 'success');
            }).catch(err => {
                const tempInput = document.createElement('input');
                tempInput.value = url;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showToast('URL Produk berhasil dicopy!', 'success');
            });
        }
        
        async function uploadMedia() { 
            const fileIn = document.getElementById('media-file'); const btn = document.getElementById('btn-upload'); 
            if(!fileIn.files[0]) return showToast('Pilih file yang ingin diupload!', 'warning'); 
            if(!IK_PUB || !IK_END) return showToast('Konfigurasi ImageKit belum lengkap. Isi public key dan URL endpoint di Pengaturan Sistem.', 'warning');
            btn.disabled=true; btn.innerText='IZIN...'; 
            try { 
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const authRes = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildAdminAuthPayload({ action: 'get_ik_auth' })) }); 
                const auth = await authRes.json(); 
                if(auth.status !== 'success') throw new Error(auth.message); 
                btn.innerText = 'UPLOADING...'; 
                const fd = new FormData(); fd.append('file', fileIn.files[0]); fd.append('fileName', fileIn.files[0].name); fd.append('publicKey', IK_PUB); fd.append('signature', auth.signature); fd.append('expire', auth.expire); fd.append('token', auth.token); 
                const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd }); 
                const r = await ikRes.json(); 
                if(!ikRes.ok) {
                    throw new Error(r.message || r.error || ('Upload ditolak ImageKit (HTTP ' + ikRes.status + ')'));
                }
                if(r.url) { 
                    document.getElementById('media-res-box').classList.remove('hidden'); 
                    document.getElementById('media-url-res').value = r.url; 
                    showToast('Upload Sukses!', 'success'); 
                    loadMediaFiles();
                } else {
                    throw new Error(r.message || 'Upload gagal. URL file tidak diterima dari ImageKit.');
                } 
            } catch (err) { 
                showToast('Upload Gagal: ' + err.message, 'error'); 
            } 
            btn.disabled=false; btn.innerText='UPLOAD'; 
        }

        function copyLink() { const c = document.getElementById('media-url-res'); c.select(); document.execCommand('copy'); showToast('Berhasil dicopy!', 'success'); }

        function renderUsageBars(items, emptyMessage) {
            const list = Array.isArray(items) ? items : [];
            if (!list.length) return `<p class="text-slate-400 italic">${emptyMessage}</p>`;
            const max = Math.max(...list.map(item => Number(item.count || 0)), 1);
            return list.map(item => {
                const count = Number(item.count || 0);
                const width = Math.max(6, Math.round((count / max) * 100));
                const label = item.bucket || item.path || item.action || '-';
                return `
                    <div class="space-y-1">
                        <div class="flex items-center justify-between gap-3">
                            <span class="font-mono text-[11px] text-slate-400 truncate">${label}</span>
                            <span class="font-bold text-white">${count.toLocaleString('id-ID')}</span>
                        </div>
                        <div class="h-2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]" style="background: rgba(255,255,255,0.05);">
                            <div class="h-full rounded-full" style="width:${width}%; background: linear-gradient(90deg, #017A6B 0%, #B6FF00 100%); box-shadow: 0 0 10px rgba(182,255,0,0.5);"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderClientFetchStats() {
            const box = document.getElementById('client-fetch-stats');
            if (!box) return;
            const stats = (window.__CEPAT_GET_FETCH_STATS__ && typeof window.__CEPAT_GET_FETCH_STATS__ === 'function')
                ? window.__CEPAT_GET_FETCH_STATS__()
                : null;
            if (!stats) {
                box.innerHTML = '<p class="text-slate-400 italic">Client fetch stats belum tersedia.</p>';
                return;
            }
            box.innerHTML = `
                <div class="rounded-xl glass-card border border-[rgba(255,255,255,0.05)] p-4 shadow-none">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Network Hits</p>
                    <p class="text-2xl font-bold text-[#B6FF00] mt-2 drop-shadow-[0_0_10px_rgba(182,255,0,0.3)]">${Number(stats.network_requests || 0).toLocaleString('id-ID')}</p>
                </div>
                <div class="rounded-xl glass-card border border-[rgba(255,255,255,0.05)] p-4 shadow-none">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saved Requests</p>
                    <p class="text-2xl font-bold text-[#017A6B] mt-2 drop-shadow-[0_0_10px_rgba(1,122,107,0.3)]">${Number(stats.saved_requests || 0).toLocaleString('id-ID')}</p>
                    <p class="text-[11px] text-slate-400 mt-2">Memory + session/local storage hits + dedupe</p>
                </div>
                <div class="rounded-xl glass-card border border-[rgba(255,255,255,0.05)] p-4 shadow-none">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cache Breakdown</p>
                    <p class="text-sm font-medium text-white mt-2">Memory: ${Number(stats.memory_cache_hits || 0).toLocaleString('id-ID')}</p>
                    <p class="text-sm font-medium text-white">Storage: ${Number(stats.storage_cache_hits || 0).toLocaleString('id-ID')}</p>
                    <p class="text-sm font-medium text-[#B6FF00]">Deduped: ${Number(stats.deduped_requests || 0).toLocaleString('id-ID')}</p>
                </div>
            `;
        }

        function renderWorkerBudgetMetrics(payload) {
            const data = payload && payload.data ? payload.data : {};
            const budget = data.budget || {};
            const alerts = Array.isArray(budget.alerts) ? budget.alerts : [];
            const cacheSummary = data.cache_summary || {};
            const circuit = data.circuit_breaker || {};

            document.getElementById('worker-day-requests').innerText = Number(budget.current_day_requests || 0).toLocaleString('id-ID');
            document.getElementById('worker-day-percent').innerText = `${Number(budget.daily_percent || 0).toLocaleString('id-ID')}% dari limit ${Number(budget.daily_limit || 0).toLocaleString('id-ID')}/hari`;
            document.getElementById('worker-hour-requests').innerText = Number(budget.current_hour_requests || 0).toLocaleString('id-ID');
            document.getElementById('worker-cache-ratio').innerText = `${Number(cacheSummary.hit_ratio_percent || 0).toLocaleString('id-ID')}%`;
            document.getElementById('worker-saved-requests').innerText = `Estimasi request dihemat: ${Number(data.estimated_saved_requests || 0).toLocaleString('id-ID')}`;
            document.getElementById('worker-circuit-state').innerText = circuit.is_open ? 'OPEN' : 'CLOSED';
            document.getElementById('worker-circuit-state').className = `text-3xl font-bold mt-2 ${circuit.is_open ? 'text-red-600' : 'text-emerald-600'}`;
            document.getElementById('worker-circuit-detail').innerText = circuit.is_open
                ? `Retry setelah ${circuit.opened_until ? new Date(circuit.opened_until).toLocaleTimeString('id-ID') : '-'}`
                : `Failure streak: ${Number(circuit.consecutive_failures || 0).toLocaleString('id-ID')}`;

            const alertBox = document.getElementById('worker-budget-alert');
            if (!alerts.length) {
                alertBox.className = 'hidden rounded-2xl border px-4 py-3 text-xs font-medium mb-6';
            } else {
                const hasCritical = alerts.some(item => item.level === 'critical');
                alertBox.className = `rounded-2xl border px-4 py-3 text-xs font-medium mb-6 ${hasCritical ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`;
                alertBox.innerText = alerts.map(item => item.message).join(' ');
            }

            document.getElementById('worker-hourly-series').innerHTML = renderUsageBars((budget.hourly_series || []).slice(-8), 'Belum ada data per jam.');
            document.getElementById('worker-daily-series').innerHTML = renderUsageBars((budget.daily_series || []).slice(-7), 'Belum ada data harian.');
            document.getElementById('worker-top-paths').innerHTML = renderUsageBars((data.top_paths || []).slice(0, 8), 'Belum ada data path.');
            document.getElementById('worker-top-actions').innerHTML = renderUsageBars((data.top_api_actions || []).slice(0, 8), 'Belum ada data action.');
            renderClientFetchStats();
            lucide.createIcons();
        }

        async function loadWorkerBudgetMetrics(showToastOnError = false) {
            const settingsTab = document.getElementById('tab-settings');
            const exists = settingsTab && settingsTab.classList.contains('active');
            if (!exists && showToastOnError === false) return;
            try {
                const res = await fetch('/__worker_metrics', { method: 'GET' });
                const data = await res.json();
                if (!res.ok || data.status !== 'ok') {
                    throw new Error(data.message || 'Metrics worker tidak tersedia.');
                }
                renderWorkerBudgetMetrics(data);
            } catch (error) {
                if (showToastOnError) showToast(error.message || 'Gagal memuat metrics worker.', 'error');
                const alertBox = document.getElementById('worker-budget-alert');
                if (alertBox) {
                    alertBox.className = 'rounded-2xl border px-4 py-3 text-xs font-medium mb-6 bg-red-50 border-red-200 text-red-700';
                    alertBox.innerText = error.message || 'Gagal memuat metrics worker.';
                }
            }
        }

        function ensureWorkerMetricsPolling() {
            if (workerMetricsTimer) return;
            workerMetricsTimer = setInterval(() => {
                const settingsTab = document.getElementById('tab-settings');
                if (!settingsTab || !settingsTab.classList.contains('active')) return;
                if (document.visibilityState !== 'visible') return;
                loadWorkerBudgetMetrics(false);
            }, 5 * 60 * 1000);
        }
        
        function switchTab(t) { 
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); 
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); 
            document.getElementById('tab-'+t).classList.add('active'); 
            document.getElementById('nav-'+t).classList.add('active'); 
            const titles = { 'orders': 'Dashboard', 'admin-orders': 'Manajemen Pesanan', 'members': 'Data Member', 'products': 'Produk & Layanan', 'pages': 'Halaman CMS', 'media': 'Media Center', 'settings': 'Pengaturan Sistem', 'stats': 'Statistik', 'vouchers': 'Voucher & Promosi' };
            document.getElementById('tab-title').innerText = titles[t] || 'Dashboard';
            lucide.createIcons();
            if(t === 'media') loadMediaFiles();
            if(t === 'stats') loadGAStats(); 
            
            // Lazy load Admin Orders
            if (t === 'admin-orders') {
                const iframe = document.getElementById('iframe-admin-orders');
                if (iframe && !iframe.getAttribute('src')) {
                    iframe.src = iframe.getAttribute('data-src') + '?v=' + new Date().getTime();
                }
            }

            if (t === 'settings') {
                ensureWorkerMetricsPolling();
                loadWorkerBudgetMetrics(false);
            }
            
            if(t === 'vouchers') { loadVouchers(); loadVoucherProducts(); loadPromotion(); }

            if(window.innerWidth < 768) toggleSidebar(); 
        }

        // ========================================
        // VOUCHER & PROMOTION MANAGEMENT
        // ========================================
        let voucherProductsList = []; // Cache of active products for voucher selectors

        async function loadVoucherProducts() {
            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) return;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_products' }))
                });
                const r = await res.json();
                if (r.status === 'success' && Array.isArray(r.products)) {
                    // Exclude only 'Inactive' status products — include hidden ones
                    voucherProductsList = r.products.filter(p => String(p[5] || '').trim() === 'Active');
                    // Populate promo product dropdown
                    populatePromoProductDropdown();
                }
            } catch(e) { /* silent */ }
        }

        function populatePromoProductDropdown() {
            const sel = document.getElementById('promo-product-id');
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- Semua Produk --</option>';
            voucherProductsList.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p[0];
                opt.textContent = p[1] + (String(p[15]).toUpperCase() === 'TRUE' ? ' [Tersembunyi]' : '');
                sel.appendChild(opt);
            });
            if (currentVal) sel.value = currentVal;
        }

        function renderVoucherProductCheckboxes(selectedIds = []) {
            const box = document.getElementById('v-product-checkboxes');
            if (!box) return;
            if (!voucherProductsList.length) {
                box.innerHTML = '<p class="text-slate-400 text-xs italic text-center py-4">Belum ada produk aktif.</p>';
                return;
            }
            box.innerHTML = voucherProductsList.map(p => {
                const isHidden = String(p[15]).toUpperCase() === 'TRUE';
                const checked = selectedIds.includes(String(p[0])) ? 'checked' : '';
                return `<label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    <input type="checkbox" value="${p[0]}" name="v-products" ${checked} class="text-[#B6FF00] focus:ring-[#B6FF00] focus:ring-offset-0 bg-transparent border-slate-600 rounded">
                    <span class="text-sm text-white">${p[1]}${isHidden ? '<span class="ml-2 text-[10px] font-bold px-2 py-0.5 bg-[rgba(245,158,11,0.15)] text-amber-400 rounded-full border border-amber-500/30">Tersembunyi</span>' : ''}</span>
                    <span class="ml-auto text-xs text-slate-400 font-mono">Rp ${Number(p[4] || 0).toLocaleString('id-ID')}</span>
                </label>`;
            }).join('');
            lucide.createIcons();
        }

        async function loadVouchers() {
            const tbody = document.getElementById('list-vouchers');
            if (!tbody) return;
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-10 text-center"><i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto text-slate-400"></i></td></tr>';
            lucide.createIcons();
            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_vouchers' }))
                });
                const r = await res.json();
                if (r.status === 'success') {
                    renderVouchers(r.vouchers || []);
                } else {
                    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-red-400 text-xs">${r.message || 'Gagal memuat voucher'}</td></tr>`;
                }
            } catch(e) {
                tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-red-400 text-xs">${e.message}</td></tr>`;
            }
        }

        function renderVouchers(vouchers) {
            const tbody = document.getElementById('list-vouchers');
            if (!tbody) return;
            if (!vouchers.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400 text-xs italic">Belum ada voucher. Klik "Buat Voucher" untuk memulai.</td></tr>';
                return;
            }
            const nf = new Intl.NumberFormat('id-ID');
            tbody.innerHTML = vouchers.map(v => {
                const isActive = String(v.status || '').toLowerCase() === 'active';
                const statusBadge = isActive
                    ? '<span class="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-[rgba(182,255,0,0.1)] text-[#B6FF00] border border-[rgba(182,255,0,0.3)]">Aktif</span>'
                    : '<span class="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-[rgba(239,68,68,0.1)] text-red-400 border border-red-500/30">Nonaktif</span>';
                const discountLabel = v.discount_type === 'percent'
                    ? `<span class="text-[#B6FF00] font-black">${v.discount_value}%</span>${v.max_discount_amount > 0 ? `<span class="text-slate-500 text-xs"> (maks Rp ${nf.format(v.max_discount_amount)})</span>` : ''}`
                    : `<span class="text-emerald-400 font-black">Rp ${nf.format(v.discount_value)}</span>`;
                const applyLabel = v.apply_to === 'specific'
                    ? `${v.product_ids.length} Produk`
                    : '<span class="text-slate-400">Semua Produk</span>';
                const usageLabel = v.max_uses > 0
                    ? `${v.used_count} / ${v.max_uses}`
                    : `${v.used_count} / ∞`;
                const expiryLabel = v.expires_at
                    ? new Date(v.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '<span class="text-slate-500">—</span>';
                return `<tr class="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-black text-white bg-[rgba(182,255,0,0.08)] border border-[rgba(182,255,0,0.2)] px-3 py-1 rounded-lg text-sm tracking-widest">${v.code}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm">${discountLabel}</td>
                    <td class="px-6 py-4 text-sm text-slate-300">${applyLabel}</td>
                    <td class="px-6 py-4 text-sm text-slate-300 font-mono">${usageLabel}</td>
                    <td class="px-6 py-4 text-sm text-slate-300">${expiryLabel}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="editVoucher(${JSON.stringify(v).split('"').join("'")})" class="text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-[#B6FF00] transition-colors px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(182,255,0,0.1)] border border-[rgba(255,255,255,0.05)]">
                                <i data-lucide="pencil" class="w-3.5 h-3.5 inline"></i>
                            </button>
                            <button onclick="deleteVoucher('${v.id}','${v.code}')" class="text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(239,68,68,0.1)] border border-[rgba(255,255,255,0.05)]">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
            lucide.createIcons();
        }

        function openVoucherModal(voucher) {
            document.getElementById('v-id').value = '';
            document.getElementById('v-code').value = '';
            document.getElementById('v-discount-type').value = 'percent';
            document.getElementById('v-discount-value').value = '';
            document.getElementById('v-max-discount-amount').value = '';
            document.getElementById('v-apply-all').checked = true;
            document.getElementById('v-product-select-wrapper').classList.add('hidden');
            document.getElementById('v-max-uses').value = '';
            document.getElementById('v-expires-at').value = '';
            document.getElementById('v-min-purchase').value = '';
            document.getElementById('v-status').value = 'Active';
            document.getElementById('voucher-modal-title').innerText = 'Buat Voucher Baru';
            document.getElementById('v-value-label').innerText = 'Nilai Diskon (%)';
            document.getElementById('v-max-discount-wrapper').classList.remove('hidden');
            renderVoucherProductCheckboxes([]);
            const modal = document.getElementById('modal-voucher');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            lucide.createIcons();
        }

        function editVoucher(vStr) {
            let v;
            try { v = typeof vStr === 'string' ? JSON.parse(vStr.replace(/'/g, '"')) : vStr; } catch(e) { return; }
            document.getElementById('v-id').value = v.id || '';
            document.getElementById('v-code').value = v.code || '';
            document.getElementById('v-discount-type').value = v.discount_type || 'percent';
            document.getElementById('v-discount-value').value = v.discount_value || '';
            document.getElementById('v-max-discount-amount').value = v.max_discount_amount || '';
            if (v.apply_to === 'specific') {
                document.getElementById('v-apply-specific').checked = true;
                document.getElementById('v-product-select-wrapper').classList.remove('hidden');
            } else if (v.apply_to === 'exclude') {
                document.getElementById('v-apply-exclude').checked = true;
                document.getElementById('v-product-select-wrapper').classList.remove('hidden');
            } else {
                document.getElementById('v-apply-all').checked = true;
                document.getElementById('v-product-select-wrapper').classList.add('hidden');
            }
            document.getElementById('v-max-uses').value = v.max_uses || '';
            document.getElementById('v-expires-at').value = v.expires_at || '';
            document.getElementById('v-min-purchase').value = v.min_purchase || '';
            document.getElementById('v-status').value = v.status || 'Active';
            document.getElementById('voucher-modal-title').innerText = 'Edit Voucher';
            updateVoucherValueLabel();
            renderVoucherProductCheckboxes(Array.isArray(v.product_ids) ? v.product_ids : []);
            const modal = document.getElementById('modal-voucher');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            lucide.createIcons();
        }

        function closeVoucherModal() {
            const modal = document.getElementById('modal-voucher');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        function toggleProductSelector() {
            const specific = document.getElementById('v-apply-specific')?.checked;
            const exclude = document.getElementById('v-apply-exclude')?.checked;
            document.getElementById('v-product-select-wrapper').classList.toggle('hidden', !(specific || exclude));
        }

        function updateVoucherValueLabel() {
            const type = document.getElementById('v-discount-type').value;
            document.getElementById('v-value-label').innerText = type === 'percent' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)';
            const maxDiscWrapper = document.getElementById('v-max-discount-wrapper');
            if (maxDiscWrapper) maxDiscWrapper.classList.toggle('hidden', type === 'flat');
        }

        async function submitVoucher() {
            const btn = document.getElementById('btn-save-voucher');
            const oriText = btn.innerHTML;
            const code = document.getElementById('v-code').value.trim();
            const discountType = document.getElementById('v-discount-type').value;
            const discountValue = Number(document.getElementById('v-discount-value').value);
            const maxDiscountAmount = Number(document.getElementById('v-max-discount-amount').value || 0);
            const applyTo = document.querySelector('input[name="v-apply-to"]:checked')?.value || 'all';
            const maxUses = Number(document.getElementById('v-max-uses').value || 0);
            const expiresAt = document.getElementById('v-expires-at').value;
            const minPurchase = Number(document.getElementById('v-min-purchase').value || 0);
            const status = document.getElementById('v-status').value;
            const vId = document.getElementById('v-id').value;

            if (!code) { showToast('Kode voucher wajib diisi!', 'warning'); return; }
            if (!discountValue || discountValue <= 0) { showToast('Nilai diskon harus lebih dari 0!', 'warning'); return; }
            if (discountType === 'percent' && discountValue > 100) { showToast('Diskon persen tidak boleh melebihi 100%!', 'warning'); return; }

            let productIds = [];
            if (applyTo === 'specific') {
                document.querySelectorAll('input[name="v-products"]:checked').forEach(cb => productIds.push(cb.value));
                if (!productIds.length) { showToast('Pilih minimal satu produk untuk voucher ini!', 'warning'); return; }
            }

            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...';
            lucide.createIcons();

            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia');
                const payload = {
                    action: 'save_voucher', id: vId || undefined,
                    code, discount_type: discountType, discount_value: discountValue,
                    max_discount_amount: maxDiscountAmount, apply_to: applyTo,
                    product_ids: productIds, max_uses: maxUses, expires_at: expiresAt,
                    min_purchase: minPurchase, status
                };
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload(payload))
                });
                const r = await res.json();
                if (r.status === 'success') {
                    showToast(r.message || 'Voucher disimpan!', 'success');
                    closeVoucherModal();
                    loadVouchers();
                } else {
                    showToast(r.message || 'Gagal menyimpan voucher', 'error');
                }
            } catch(e) {
                showToast('Terjadi kesalahan: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = oriText;
                lucide.createIcons();
            }
        }

        async function deleteVoucher(id, code) {
            const confirmed = await customConfirm(`Hapus voucher "${code}"? Tindakan ini tidak dapat dibatalkan.`);
            if (!confirmed) return;
            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'delete_voucher', id }))
                });
                const r = await res.json();
                if (r.status === 'success') {
                    showToast('Voucher berhasil dihapus!', 'success');
                    loadVouchers();
                } else {
                    showToast(r.message || 'Gagal menghapus voucher', 'error');
                }
            } catch(e) {
                showToast('Terjadi kesalahan: ' + e.message, 'error');
            }
        }

        async function loadPromotion() {
            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) return;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_promotion' }))
                });
                const r = await res.json();
                if (r.status === 'success') {
                    const enabled = r.enabled === true;
                    document.getElementById('promo-enabled').checked = enabled;
                    togglePromoFields();
                    if (r.product_id) { 
                        const sel = document.getElementById('promo-product-id');
                        if (sel) sel.value = r.product_id;
                    }
                    if (r.voucher_code) document.getElementById('promo-voucher-code').value = r.voucher_code;
                    if (r.title) document.getElementById('promo-title').value = r.title;
                    if (r.subtitle) document.getElementById('promo-subtitle').value = r.subtitle;
                    if (r.image_url) document.getElementById('promo-image-url').value = r.image_url;
                    if (r.cta_text) document.getElementById('promo-cta-text').value = r.cta_text;
                    updatePromoPreview();
                }
            } catch(e) { /* silent */ }
        }

        function togglePromoFields() {
            const enabled = document.getElementById('promo-enabled').checked;
            const fields = document.getElementById('promo-fields');
            if (enabled) {
                fields.classList.remove('opacity-50', 'pointer-events-none');
            } else {
                fields.classList.add('opacity-50', 'pointer-events-none');
            }
        }

        function updatePromoPreview() {
            const title = document.getElementById('promo-title')?.value || '🔥 Penawaran Spesial!';
            const subtitle = document.getElementById('promo-subtitle')?.value || 'Dapatkan diskon eksklusif sekarang!';
            const code = document.getElementById('promo-voucher-code')?.value || 'DISKON20';
            const cta = document.getElementById('promo-cta-text')?.value || 'Klaim Diskon Sekarang';
            const titleEl = document.getElementById('promo-preview-title');
            const subtitleEl = document.getElementById('promo-preview-subtitle');
            const codeEl = document.getElementById('promo-preview-code');
            const ctaEl = document.getElementById('promo-preview-cta');
            if (titleEl) titleEl.innerText = title;
            if (subtitleEl) subtitleEl.innerText = subtitle;
            if (codeEl) codeEl.innerText = code.toUpperCase() || 'DISKON20';
            if (ctaEl) ctaEl.innerText = cta;
        }

        // Bind preview updates
        document.addEventListener('DOMContentLoaded', () => {
            ['promo-title', 'promo-subtitle', 'promo-voucher-code', 'promo-cta-text'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', updatePromoPreview);
            });
        });

        async function savePromotion() {
            const btn = document.getElementById('btn-save-promotion');
            const oriText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...';
            lucide.createIcons();
            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia');
                const payload = {
                    action: 'save_promotion',
                    promotion_enabled: document.getElementById('promo-enabled').checked ? 'true' : 'false',
                    promotion_product_id: document.getElementById('promo-product-id')?.value || '',
                    promotion_voucher_code: (document.getElementById('promo-voucher-code')?.value || '').toUpperCase(),
                    promotion_title: document.getElementById('promo-title')?.value || '',
                    promotion_subtitle: document.getElementById('promo-subtitle')?.value || '',
                    promotion_image_url: document.getElementById('promo-image-url')?.value || '',
                    promotion_cta_text: document.getElementById('promo-cta-text')?.value || 'Klaim Diskon Sekarang'
                };
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload(payload))
                });
                const r = await res.json();
                if (r.status === 'success') {
                    showToast('Pengaturan promosi berhasil disimpan!', 'success');
                } else {
                    showToast(r.message || 'Gagal menyimpan promosi', 'error');
                }
            } catch(e) {
                showToast('Terjadi kesalahan: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = oriText;
                lucide.createIcons();
            }
        }

        async function setLunas(id) { 
            const isConfirmed = await customConfirm('Aktifkan akses materi (Lunas) untuk user ini?');
            if(!isConfirmed) return; 
            
            showToast('Memproses aktivasi...', 'warning');
            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildAdminAuthPayload({ action: 'update_order_status', id })) }); 
                const data = await res.json();
                if(data.status === 'success') {
                    syncPublicCacheStateFromPayload(data);
                    showToast('Akses produk berhasil diaktifkan!', 'success');
                    forceSync(); 
                } else {
                    showToast(data.message || 'Gagal memproses', 'error');
                }
            } catch(e) {
                showToast('Gagal menghubungi server.', 'error');
            }
        }

        async function setPending(id) { 
            const isConfirmed = await customConfirm('Non-aktifkan akses materi (Pending) untuk user ini?');
            if(!isConfirmed) return; 
            
            showToast('Memproses penonaktifan...', 'warning');
            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'update_order_status', id: id, status: 'Pending' })) 
                }); 
                const data = await res.json();
                if(data.status === 'success') {
                    syncPublicCacheStateFromPayload(data);
                    showToast('Akses produk berhasil dinonaktifkan!', 'success');
                    forceSync();
                } else {
                    showToast(data.message || 'Gagal memproses', 'error');
                }
            } catch(e) {
                showToast('Gagal menghubungi server.', 'error');
            }
        }

        function openProdModal() { 
            document.getElementById('form-prod').reset(); 
            document.getElementById('p-desc').value = '';
            document.getElementById('p-rekomendasi').checked = false;
            const hiddenEl = document.getElementById('p-hidden'); if (hiddenEl) hiddenEl.checked = false;
            const inactiveEl2 = document.getElementById('p-inactive'); if (inactiveEl2) inactiveEl2.checked = false;
            updateProductDescriptionCounter('');
            updateProdPreview(''); 
            document.getElementById('p-is-edit').value = 'false';
            // Reset previews
            const discPreview = document.getElementById('p-discount-preview');
            const commPreview = document.getElementById('p-commission-preview');
            if (discPreview) { discPreview.classList.add('hidden'); discPreview.textContent = ''; }
            if (commPreview) { commPreview.classList.add('hidden'); commPreview.textContent = ''; } 
            
            // Auto-generate Unique ID
            const prefix = 'PRD';
            // 3 random chars (base36)
            const random = Math.random().toString(36).substring(2, 5).toUpperCase();
            // 3 last digits of timestamp
            const timestamp = Date.now().toString().slice(-3);
            let newId = `${prefix}-${random}${timestamp}`;
            
            // Ensure uniqueness against cachedProducts
            if (typeof cachedProducts !== 'undefined' && Array.isArray(cachedProducts)) {
                let counter = 1;
                const originalId = newId;
                while(cachedProducts.some(p => p[0] === newId)) {
                    newId = `${originalId}-${counter}`;
                    counter++;
                }
            }
            
            const idInput = document.getElementById('p-id');
            idInput.value = newId;
            idInput.readOnly = true;
            // Visual feedback for read-only: keep dark glass look, just reduce opacity
            idInput.classList.add('opacity-60', 'cursor-not-allowed');
            idInput.classList.remove('focus:border-[#B6FF00]');
            idInput.classList.add('glass-input', 'text-white');
            
            (function(m){ m.classList.remove('hidden'); m.classList.add('flex'); })(document.getElementById('modal-prod')); 
        }
        function openPageModal() {
            document.getElementById('form-page').reset();
            document.getElementById('pg-is-edit').value = 'false';
            // Clear protect dropdown
            const sel = document.getElementById('pg-protected-product');
            if (sel) sel.value = '';
            (function(m){ m.classList.remove('hidden'); m.classList.add('flex'); })(document.getElementById('modal-page'));
        }
        function closeModal(id) { const m=document.getElementById(id); m.classList.add('hidden'); m.classList.remove('flex'); }
        async function revokeAdminSessionOnServer() {
            const token = String(sessionStorage.getItem('auth_session_token') || '');
            if (!token) return false;
            const primaryEndpoint = getApiEndpoint();
            const scriptFallback = (typeof SCRIPT_URL !== 'undefined') ? SCRIPT_URL : null;
            const endpoints = [primaryEndpoint, scriptFallback]
                .filter(Boolean)
                .filter((value, index, arr) => arr.indexOf(value) === index);

            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'admin_logout',
                            auth_session_token: token,
                            auth_role: sessionStorage.getItem('auth_role') || ''
                        })
                    });
                    const payload = await readJsonSafe(res);
                    if (payload && payload.status === 'success') return true;
                } catch (err) {}
            }
            return false;
        }

        function syncPublicCacheStateFromPayload(payload) {
            const state = payload && payload.cache_state;
            if (!state) return;
            try {
                if (window.CEPAT_CACHE_STATE && typeof window.CEPAT_CACHE_STATE.sync === 'function') {
                    window.CEPAT_CACHE_STATE.sync(state, Date.now());
                }
            } catch (e) {}
        }

        async function logout() {
            await revokeAdminSessionOnServer();
            if (workerMetricsTimer) {
                clearInterval(workerMetricsTimer);
                workerMetricsTimer = null;
            }
            clearAdminSession();
            localStorage.removeItem(CACHE_KEY_ADMIN);
            location.reload();
        }

        async function submitFormToGAS(formId, payload, successMsg, modalIdToClose = null) {
            const form = document.getElementById(formId);
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin inline-block align-middle mr-2"></i>PROSES...';
            btn.disabled = true;
            lucide.createIcons();

            try {
                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');
                if (!payload.rid) payload.rid = 'ADM-' + Date.now() + '-' + Math.random().toString(16).slice(2);
                const securePayload = buildAdminAuthPayload(payload);
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(securePayload)
                });
                
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch(e) { throw new Error('Format respon server tidak valid.'); }

                if(data.status === 'success') {
                    syncPublicCacheStateFromPayload(data);
                    if(modalIdToClose) closeModal(modalIdToClose);
                    showToast(successMsg, 'success');
                    forceSync();
                } else {
                    showToast(data.message || 'Gagal diproses oleh server', 'error');
                }
            } catch(err) {
                showToast('Koneksi terputus: ' + err.message, 'error');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }

        document.getElementById('form-prod').onsubmit = async (e) => { 
            e.preventDefault(); 
            const descField = document.getElementById('p-desc');
            const descValidation = validateProductDescriptionInput(descField.value);
            if (descValidation.errors.length) {
                showToast(descValidation.errors[0], 'error');
                return;
            }
            descField.value = descValidation.value;
            updateProductDescriptionCounter(descValidation.value);
            const p = { 
                action: 'save_product', 
                id: document.getElementById('p-id').value, 
                title: document.getElementById('p-title').value, 
                desc: descValidation.value, 
                url: document.getElementById('p-url').value, 
                category: document.getElementById('p-category').value,
                harga: document.getElementById('p-harga').value, 
                harga_coret: document.getElementById('p-harga-coret').value || '',
                commission: document.getElementById('p-commission').value,
                lp_url: document.getElementById('p-lp').value,
                image_url: document.getElementById('p-image').value, 
                pixel_id: document.getElementById('p-pixel-id').value,
                pixel_token: document.getElementById('p-pixel-token').value,
                pixel_test_code: document.getElementById('p-pixel-test').value,
                rekomendasi: document.getElementById('p-rekomendasi').checked,
                hidden: document.getElementById('p-hidden') ? document.getElementById('p-hidden').checked : false,
                status: (document.getElementById('p-inactive') && document.getElementById('p-inactive').checked) ? 'Inactive' : 'Active',
                is_edit: document.getElementById('p-is-edit').value === 'true' 
            }; 
            await submitFormToGAS('form-prod', p, 'Produk berhasil disimpan!', 'modal-prod');
        };

        document.getElementById('p-desc').addEventListener('input', (event) => {
            updateProductDescriptionCounter(event.target.value);
        });

        document.getElementById('p-desc').addEventListener('blur', (event) => {
            event.target.value = normalizeProductDescriptionInput(event.target.value);
            updateProductDescriptionCounter(event.target.value);
        });

        updateProductDescriptionCounter(document.getElementById('p-desc').value);

        function updateDiscountPreview() {
            const harga = Number(document.getElementById('p-harga').value || 0);
            const hargaCoret = Number(document.getElementById('p-harga-coret').value || 0);
            const preview = document.getElementById('p-discount-preview');
            if (!preview) return;
            if (hargaCoret > 0 && hargaCoret > harga && harga > 0) {
                const pct = Math.round((1 - harga / hargaCoret) * 100);
                preview.textContent = `💰 Diskon ${pct}% dari harga normal Rp ${hargaCoret.toLocaleString('id-ID')}`;
                preview.classList.remove('hidden');
            } else {
                preview.textContent = '';
                preview.classList.add('hidden');
            }
        }

        function updateCommissionPreview() {
            const harga = Number(document.getElementById('p-harga').value || 0);
            const comm = Number(document.getElementById('p-commission').value || 0);
            const preview = document.getElementById('p-commission-preview');
            if (!preview) return;
            if (comm > 0 && harga > 0) {
                const pct = Math.round((comm / harga) * 100);
                preview.textContent = `🤝 Komisi ${pct}% dari harga jual`;
                preview.classList.remove('hidden');
            } else {
                preview.textContent = '';
                preview.classList.add('hidden');
            }
        }

        document.getElementById('form-page').onsubmit = async (e) => { 
            e.preventDefault(); 
            const sel = document.getElementById('pg-protected-product');
            const p = { 
                action: 'save_page', 
                id: document.getElementById('pg-id').value, 
                slug: document.getElementById('pg-slug').value, 
                title: document.getElementById('pg-title').value, 
                content: document.getElementById('pg-content').value,
                meta_pixel_id: document.getElementById('pg-pixel-id').value,
                meta_pixel_token: document.getElementById('pg-pixel-token').value,
                meta_pixel_test_event: document.getElementById('pg-pixel-test').value,
                protected_product_id: sel ? sel.value : '',
                theme_mode: 'dark',
                is_edit: document.getElementById('pg-is-edit').value === 'true' 
            }; 
            await submitFormToGAS('form-page', p, 'Halaman CMS tersimpan!', 'modal-page');
        };

        document.getElementById('form-branding').onsubmit = async (e) => { 
            e.preventDefault(); 
            const rawLogo = document.getElementById('set-logo').value;
            const rawFavicon = document.getElementById('set-favicon').value;
            const siteLogo = normalizeBrandAssetUrl(rawLogo);
            const siteFavicon = normalizeBrandAssetUrl(rawFavicon);
            const rejectedLogo = rawLogo.trim() && !siteLogo;
            const rejectedFavicon = rawFavicon.trim() && !siteFavicon;
            if (rejectedLogo || rejectedFavicon) {
                showToast('URL branding placeholder/tidak valid diabaikan. Gunakan URL HTTPS yang benar atau kosongkan field.', 'warning');
                if (rejectedLogo) document.getElementById('set-logo').value = '';
                if (rejectedFavicon) document.getElementById('set-favicon').value = '';
            }
            const p = { 
                site_name: document.getElementById('set-site-name').value, 
                site_tagline: document.getElementById('set-site-tagline').value, 
                site_logo: siteLogo || document.getElementById('set-logo').value, 
                site_favicon: siteFavicon || document.getElementById('set-favicon').value 
            }; 
            await submitFormToGAS('form-branding', { action: 'update_settings', payload: p }, 'Branding Tersimpan!');
        };

        function setActionButtonBusy(buttonId, busy, busyLabel) {
            const btn = document.getElementById(buttonId);
            if (!btn) return;
            if (busy) {
                if (!btn.dataset.defaultLabel) btn.dataset.defaultLabel = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="inline-flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i>' + (busyLabel || 'Memproses...') + '</span>';
                lucide.createIcons();
                return;
            }
            btn.disabled = false;
            if (btn.dataset.defaultLabel) btn.innerHTML = btn.dataset.defaultLabel;
            lucide.createIcons();
        }

        function getSettingsEndpoint() {
            const endpoint = getApiEndpoint();
            if (!endpoint) throw new Error('API endpoint tidak tersedia.');
            return endpoint;
        }

        async function submitSettingsAction(action, payload) {
            const endpoint = getSettingsEndpoint();
            const reqPayload = buildAdminAuthPayload({ action, payload });
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqPayload)
            });
            const rawText = await res.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (parseError) {
                throw new Error('Respons update pengaturan tidak valid dari server.');
            }
            if (!res.ok) {
                throw new Error(String(data.message || ('Permintaan gagal (HTTP ' + res.status + ').')));
            }
            if (data.status !== 'success') {
                throw new Error(String(data.message || 'Gagal menyimpan pengaturan.'));
            }
            syncCacheStateFromResponse(data.cache_state);
            return data;
        }

        async function saveMootaGatewayConfig() {
            setActionButtonBusy('btn-save-moota', true, 'Menyimpan Moota...');
            try {
                const mootaCfg = getMootaFormConfig();
                const mootaValidation = validateMootaFormConfig(mootaCfg);
                if (!mootaValidation.hasAnyValue) {
                    throw new Error('Isi Webhook URL dan Secret Token Moota terlebih dahulu.');
                }
                if (mootaValidation.errors.length) {
                    throw new Error(mootaValidation.errors[0]);
                }

                const mootaChanged = mootaCfg.gasUrl !== MOOTA_URL || !!mootaCfg.token || !MOOTA_TOKEN_CONFIGURED;
                if (mootaChanged) {
                    await testMootaConnection({ silent: true });
                }

                const payload = { moota_gas_url: mootaCfg.gasUrl };
                if (mootaCfg.token) payload.moota_token = mootaCfg.token;

                await submitSettingsAction('update_moota_gateway', payload);
                MOOTA_URL = payload.moota_gas_url;
                if (mootaCfg.token) {
                    document.getElementById('set-moota-token').value = '';
                    updateMootaHints(true);
                } else {
                    updateMootaHints(MOOTA_TOKEN_CONFIGURED);
                }
                localStorage.removeItem('cepat_global_settings');
                forceSync();
                setMootaStatus('Konfigurasi Moota Payment Gateway berhasil disimpan.', 'success');
                showToast('Moota Payment Gateway berhasil diperbarui.', 'success');
            } catch (error) {
                const msg = error && error.message ? error.message : 'Gagal menyimpan konfigurasi Moota.';
                setMootaStatus(msg, 'error');
                showToast(msg, 'error');
            } finally {
                setActionButtonBusy('btn-save-moota', false);
            }
        }

        async function saveImageKitMediaConfig() {
            setActionButtonBusy('btn-save-imagekit', true, 'Menyimpan ImageKit...');
            try {
                const ikCfg = getImageKitFormConfig();
                const ikValidation = validateImageKitFormConfig(ikCfg, { allowMissingEndpoint: true });
                if (!ikValidation.hasAnyValue) {
                    throw new Error('Isi konfigurasi ImageKit terlebih dahulu sebelum menyimpan.');
                }
                if (ikValidation.errors.length) {
                    throw new Error(ikValidation.errors[0]);
                }

                const testResult = await testImageKitConnection({ silent: true });
                if (testResult && testResult.endpoint) {
                    document.getElementById('set-ik-end').value = testResult.endpoint;
                }

                const endpointValue = normalizeImageKitEndpoint(document.getElementById('set-ik-end').value || ikCfg.endpoint);
                if (!endpointValue) {
                    throw new Error('ImageKit URL endpoint belum terdeteksi. Isi manual dari dashboard ImageKit Anda, misalnya https://ik.imagekit.io/nama-endpoint');
                }

                const payload = {
                    ik_public_key: ikCfg.publicKey,
                    ik_endpoint: endpointValue
                };
                if (ikCfg.privateKey) payload.ik_private_key = ikCfg.privateKey;

                await submitSettingsAction('update_imagekit_media', payload);

                IK_PUB = payload.ik_public_key;
                IK_END = payload.ik_endpoint;
                if (ikCfg.privateKey) {
                    document.getElementById('set-ik-priv').value = '';
                    updateImageKitPrivateHint(true);
                } else {
                    updateImageKitPrivateHint(IK_PRIVATE_CONFIGURED);
                }
                localStorage.removeItem('cepat_global_settings');
                forceSync();
                setImageKitStatus('Konfigurasi ImageKit Media Center berhasil disimpan.', 'success');
                showToast('ImageKit Media Center berhasil diperbarui.', 'success');
            } catch (error) {
                const msg = error && error.message ? error.message : 'Gagal menyimpan konfigurasi ImageKit.';
                setImageKitStatus(msg, 'error');
                showToast(msg, 'error');
            } finally {
                setActionButtonBusy('btn-save-imagekit', false);
            }
        }

        document.getElementById('form-sys').onsubmit = async (e) => { 
            e.preventDefault(); 
            const p = { 
                contact_email: document.getElementById('set-email').value, 
                wa_admin: document.getElementById('set-wa').value, 
                fonnte_token: document.getElementById('set-fonnte').value
            }; 
            await submitFormToGAS('form-sys', { action: 'update_settings', payload: p }, 'API Sistem Umum tersimpan!');
            // Clear local cache agar perubahan langsung terlihat di halaman depan
            localStorage.removeItem('cepat_global_settings');
        };

        document.getElementById('form-cf').onsubmit = async (e) => { 
            e.preventDefault(); 
            const p = { 
                cf_zone_id: document.getElementById('set-cf-zone').value.trim(), 
                cf_api_token: document.getElementById('set-cf-token').value.trim() 
            }; 
            await submitFormToGAS('form-cf', { action: 'update_settings', payload: p }, 'Kunci Cloudflare Disimpan!');
        };

        
        // --- REAL SALES CHART IMPLEMENTATION START ---
        let adminSalesChartInstance = null;
        let cachedAdminOrdersForChart = null;

        async function fetchAndRenderSalesChartData(forceRefresh = false) {
            const loader = document.getElementById('sales-chart-loader');
            if(loader) loader.classList.remove('hidden');

            try {
                // Check cache first (Session Storage)
                const CACHE_KEY = "admin_sales_chart_orders_v1";
                if (!forceRefresh) {
                    const cachedStr = sessionStorage.getItem(CACHE_KEY);
                    if (cachedStr) {
                        try {
                            const parsedData = JSON.parse(cachedStr);
                            if (parsedData && parsedData.data && Date.now() - parsedData.timestamp < 300000) { // 5 minutes cache
                                cachedAdminOrdersForChart = parsedData.data;
                                renderSalesChart(document.getElementById('sales-chart-filter').value);
                                if(loader) loader.classList.add('hidden');
                                return;
                            }
                        } catch(e) {}
                    }
                }

                const endpoint = getApiEndpoint();
                if(!endpoint) throw new Error('API endpoint tidak tersedia');

                const res = await fetch(endpoint, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ action: 'get_admin_orders', page: 1, limit: 10000 })) 
                });
                const r = await readJsonSafe(res);
                if(r.status === 'success' && Array.isArray(r.data)) {
                    cachedAdminOrdersForChart = r.data;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: r.data
                    }));
                    renderSalesChart(document.getElementById('sales-chart-filter').value);
                }
            } catch(e) {
                console.error("Error fetching chart data:", e);
            } finally {
                if(loader) loader.classList.add('hidden');
            }
        }

        function renderSalesChart(periodDays) {
            const ctx = document.getElementById('salesChartCanvas');
            if(!ctx || !cachedAdminOrdersForChart) return;

            const daysToLookBack = periodDays === 'all' ? 3650 : parseInt(periodDays) || 7;
            const now = new Date();
            const dateMap = {};

            if (periodDays !== 'all') {
                for(let i = daysToLookBack - 1; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    dateMap[dateStr] = { 
                        lunas: { rev: 0, count: 0 },
                        pending: { rev: 0, count: 0 },
                        batal: { rev: 0, count: 0 }
                    };
                }
            }

            let sumRev = 0, sumOrders = 0, sumLunas = 0, sumPending = 0, sumBatal = 0, sumKomisi = 0;
            let lifetimeRev = 0, lifetimeOrders = 0, lifetimeKomisi = 0;
            let productSalesMap = {};

            let cutoff = new Date(now);
            if(periodDays !== 'all') {
                cutoff.setDate(cutoff.getDate() - (daysToLookBack - 1));
                cutoff.setHours(0,0,0,0);
            }

            cachedAdminOrdersForChart.forEach(order => {
                let status = String(order[7] || '').trim().toLowerCase();
                let isLunas = status === 'lunas';
                let isPending = status === 'pending';
                let isBatal = status === 'batal' || status === 'gagal';
                
                let rev = parseFloat(order[6]) || 0;
                let komisi = parseFloat(order[10]) || 0;
                
                lifetimeOrders++;
                if (isLunas) {
                    lifetimeRev += rev;
                    lifetimeKomisi += komisi;
                    let pname = order[5] || 'Produk Lainnya';
                    if (!productSalesMap[pname]) productSalesMap[pname] = { count: 0, rev: 0 };
                    productSalesMap[pname].count++;
                    productSalesMap[pname].rev += rev;
                }

                let rawDate = order[8];
                let dateObj = new Date(rawDate);
                if(isNaN(dateObj.getTime())) return;
                let isoDate = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
                
                let isWithinPeriod = false;
                if(periodDays === 'all') isWithinPeriod = true;
                else if(dateObj >= cutoff) isWithinPeriod = true;

                if(isWithinPeriod) {
                    sumOrders++;
                    if(isLunas) { sumRev += rev; sumLunas++; sumKomisi += komisi; }
                    else if(isPending) sumPending++;
                    else if(isBatal) sumBatal++;
                }

                if(periodDays === 'all' && !dateMap[isoDate]) {
                    dateMap[isoDate] = { lunas: { rev: 0, count: 0 }, pending: { rev: 0, count: 0 }, batal: { rev: 0, count: 0 }};
                }

                if(dateMap[isoDate]) {
                    if (isLunas) { dateMap[isoDate].lunas.rev += rev; dateMap[isoDate].lunas.count += 1; }
                    else if (isPending) { dateMap[isoDate].pending.rev += rev; dateMap[isoDate].pending.count += 1; }
                    else if (isBatal) { dateMap[isoDate].batal.rev += rev; dateMap[isoDate].batal.count += 1; }
                }
            });

            let nf = new Intl.NumberFormat('id-ID');
            document.getElementById('chart-sum-revenue').innerText = 'Rp ' + nf.format(sumRev);
            document.getElementById('chart-sum-orders').innerText = nf.format(sumOrders);
            document.getElementById('chart-sum-lunas').innerText = nf.format(sumLunas);
            document.getElementById('chart-sum-pending').innerText = nf.format(sumPending);
            document.getElementById('chart-sum-batal').innerText = nf.format(sumBatal);
            document.getElementById('chart-sum-komisi').innerText = 'Rp ' + nf.format(sumKomisi);

            document.getElementById('stat-rev').innerText = 'Rp ' + nf.format(lifetimeRev);
            document.getElementById('stat-orders').innerText = nf.format(lifetimeOrders);
            document.getElementById('stat-komisi').innerText = 'Rp ' + nf.format(lifetimeKomisi);
            
            let productListEl = document.getElementById('list-product-sales');
            if (productListEl) {
                let sortedProducts = Object.keys(productSalesMap).map(k => ({ name: k, count: productSalesMap[k].count, rev: productSalesMap[k].rev })).sort((a, b) => b.count - a.count);
                if (sortedProducts.length > 0) {
                    let html = '';
                    sortedProducts.forEach(p => {
                        html += `<tr class="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white" data-label="Produk"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-[rgba(182,255,0,0.1)] flex items-center justify-center text-[#B6FF00] border border-[rgba(182,255,0,0.2)]"><i data-lucide="package" class="w-4 h-4"></i></div>${p.name}</div></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-left md:text-center font-bold" data-label="Terjual">${p.count}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-[#B6FF00] text-left md:text-right font-bold tracking-wider font-mono" data-label="Total Pendapatan (IDR)">Rp ${nf.format(p.rev)}</td>
                        </tr>`;
                    });
                    productListEl.innerHTML = html;
                    if(typeof lucide !== 'undefined') lucide.createIcons();
                } else {
                    productListEl.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400 text-xs italic">Belum ada penjualan lunas.</td></tr>';
                }
            }

            const sortedDates = Object.keys(dateMap).sort();
            const labels = [];
            const dataRevLunas = [], dataCountLunas = [], dataRevPending = [], dataCountPending = [], dataRevBatal = [], dataCountBatal = [];
            
            sortedDates.forEach(dt => {
                const dObj = new Date(dt);
                labels.push(dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }));
                dataRevLunas.push(dateMap[dt].lunas.rev); dataCountLunas.push(dateMap[dt].lunas.count);
                dataRevPending.push(dateMap[dt].pending.rev); dataCountPending.push(dateMap[dt].pending.count);
                dataRevBatal.push(dateMap[dt].batal.rev); dataCountBatal.push(dateMap[dt].batal.count);
            });

            if(adminSalesChartInstance) adminSalesChartInstance.destroy();

            Chart.defaults.color = '#94a3b8';
            Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

            adminSalesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Lunas', data: dataRevLunas, orderCountData: dataCountLunas, borderColor: '#B6FF00', backgroundColor: 'rgba(182, 255, 0, 0.1)', borderWidth: 3, pointBackgroundColor: '#000018', pointBorderColor: '#B6FF00', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.4 },
                        { label: 'Pending', data: dataRevPending, orderCountData: dataCountPending, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderWidth: 3, pointBackgroundColor: '#000018', pointBorderColor: '#f59e0b', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.4 },
                        { label: 'Batal', data: dataRevBatal, orderCountData: dataCountBatal, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 3, pointBackgroundColor: '#000018', pointBorderColor: '#ef4444', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    layout: { padding: { left: 0, right: 10, top: 40, bottom: 0 } },
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', align: 'end', labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' }, boxWidth: 8, usePointStyle: true } },
                        tooltip: { backgroundColor: 'rgba(10, 10, 24, 0.95)', titleFont: { size: 13, weight: 'bold' }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8, displayColors: true, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, callbacks: { label: function(context) { let label = context.dataset.label || ''; let revStr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(context.parsed.y); let countStr = context.dataset.orderCountData[context.dataIndex]; return label + ': Rp ' + revStr + ' (' + countStr + ' Pesanan)'; } } }
                    },
                    scales: {
                        x: { grid: { display: false, drawBorder: false }, ticks: { font: { size: 10 }, color: '#64748b', maxRotation: 0 } },
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, ticks: { font: { size: 10 }, color: '#64748b', callback: function(value) { if(value >= 1000000) return 'Rp' + (value/1000000) + 'jt'; if(value >= 1000) return 'Rp' + (value/1000) + 'k'; return 'Rp' + value; }, maxTicksLimit: 6 } }
                    },
                    interaction: { intersect: false, mode: 'index' }
                }
            });
        }
        
        // --- REAL SALES CHART IMPLEMENTATION END ---

        window.onload = () => { 
            lucide.createIcons(); 
            
            // Session Restoration for Admin
            if (!sessionStorage.getItem('auth_session_token')) {
                const raw = localStorage.getItem('cepat_user_session');
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed && parsed.isAdmin && parsed.token) {
                            setUnifiedSession({
                                id: parsed.id,
                                role: 'admin',
                                name: parsed.nama,
                                email: parsed.email,
                                session_token: parsed.token
                            });
                        }
                    } catch(e) {}
                }
            }

            if(isAdminSessionActive()) init(); 
        };

        // --- ADMIN PROFILE & PASSWORD MANAGEMENT ---
        function openAdminProfileModal() {
            const adminName = sessionStorage.getItem('auth_name') || sessionStorage.getItem('adm_name') || 'Admin';
            const adminEmail = sessionStorage.getItem('auth_email') || '';
            document.getElementById('admin-profile-name').value = adminName;
            document.getElementById('admin-profile-email').value = adminEmail;
            document.getElementById('admin-profile-confirm-password').value = '';
            document.getElementById('modal-admin-profile').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeAdminProfileModal() {
            document.getElementById('modal-admin-profile').classList.add('hidden');
        }

        function openAdminPasswordModal() {
            document.getElementById('admin-input-password-lama').value = '';
            document.getElementById('admin-input-password-baru').value = '';
            document.getElementById('admin-input-konfirmasi-password').value = '';
            document.getElementById('modal-admin-password').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeAdminPasswordModal() {
            document.getElementById('modal-admin-password').classList.add('hidden');
        }

        async function saveAdminProfile() {
            const newName = document.getElementById('admin-profile-name').value.trim();
            const newEmail = document.getElementById('admin-profile-email').value.trim();
            const password = document.getElementById('admin-profile-confirm-password').value;
            const btn = document.getElementById('btn-save-admin-profile');
            const oriText = btn.innerHTML;

            if(!newName || !newEmail || !password) {
                showToast("Semua kolom wajib diisi untuk verifikasi!", "warning");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Memproses...';
            lucide.createIcons();

            try {
                const currentEmail = sessionStorage.getItem('auth_email');
                const endpoint = getApiEndpoint();
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ 
                        action: 'update_profile', 
                        email: currentEmail,
                        new_name: newName,
                        new_email: newEmail,
                        password: password
                    }))
                });
                const r = await res.json();
                
                if(r.status === 'success') {
                    showToast("Profil admin berhasil diperbarui!", "success");
                    
                    // Update Session Storage
                    sessionStorage.setItem('auth_name', r.new_name);
                    sessionStorage.setItem('auth_email', r.new_email);
                    sessionStorage.setItem('adm_name', r.new_name);

                    // Sync to persistent localStorage
                    const rawSess = localStorage.getItem('cepat_user_session');
                    if (rawSess) {
                        try {
                            const sess = JSON.parse(rawSess);
                            sess.nama = r.new_name;
                            sess.email = r.new_email;
                            localStorage.setItem('cepat_user_session', JSON.stringify(sess));
                        } catch(e) {}
                    }
                    
                    // Update UI
                    document.getElementById('admin-name').innerText = r.new_name;
                    
                    closeAdminProfileModal();
                    // Optional: Force reload data/session if email changed significantly
                } else {
                    showToast(r.message || "Gagal memperbarui profil admin", "error");
                }
            } catch(e) {
                showToast("Terjadi kesalahan koneksi", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = oriText;
                lucide.createIcons();
            }
        }

        async function prosesGantiAdminPassword() {
            const passLama = document.getElementById('admin-input-password-lama').value;
            const passBaru = document.getElementById('admin-input-password-baru').value;
            const konfirmasi = document.getElementById('admin-input-konfirmasi-password').value;
            const btn = document.getElementById('btn-save-admin-pass');
            const oriText = btn.innerHTML;

            if(!passLama || !passBaru || !konfirmasi) {
                showToast("Semua kolom password wajib diisi!", "warning");
                return;
            }

            if(passBaru.length < 6) {
                showToast("Password minimal 6 karakter!", "warning");
                return;
            }

            if(passBaru !== konfirmasi) {
                showToast("Konfirmasi password baru tidak cocok!", "error");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Memproses...';
            lucide.createIcons();

            try {
                const email = sessionStorage.getItem('auth_email');
                const endpoint = getApiEndpoint();
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(buildAdminAuthPayload({ 
                        action: 'change_password', 
                        email: email,
                        old_password: passLama,
                        new_password: passBaru
                    }))
                });
                const r = await res.json();
                
                if(r.status === 'success') {
                    showToast("Password berhasil diganti!", "success");
                    closeAdminPasswordModal();
                } else {
                    showToast(r.message || "Gagal mengganti password", "error");
                }
            } catch(e) {
                showToast("Terjadi kesalahan koneksi", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = oriText;
                lucide.createIcons();
            }
        }

        // ================================================================
        // GOOGLE ANALYTICS 4 STATISTICS MODULE
        // Measurement ID: G-GZM06L9YDH
        // ================================================================

        let gaVisitorChart = null;
        let gaDeviceChart = null;
        let gaStatsLoaded = false;

        const GA_COLORS = {
            primary: '#B6FF00',
            secondary: '#017A6B',
            indigo: '#818cf8',
            amber: '#fbbf24',
            emerald: '#34d399',
            violet: '#a78bfa',
            sky: '#38bdf8',
            rose: '#fb7185'
        };

        function formatGANumber(n) {
            if (n == null || isNaN(n)) return '-';
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'jt';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'rb';
            return String(Math.round(n));
        }

        function formatDuration(seconds) {
            if (!seconds || isNaN(seconds)) return '-';
            const m = Math.floor(seconds / 60);
            const s = Math.round(seconds % 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        function formatPct(val, total) {
            if (!total) return '0%';
            return ((val / total) * 100).toFixed(1) + '%';
        }

        function renderChangeChip(change, unit = '') {
            if (change == null || isNaN(change)) return '<span class="text-slate-400 text-xs">vs periode sebelumnya</span>';
            const positive = change >= 0;
            const arrow = positive ? '▲' : '▼';
            const color = positive ? 'text-emerald-400' : 'text-rose-400';
            return `<span class="${color} text-xs font-bold">${arrow} ${Math.abs(change).toFixed(1)}${unit}%</span> <span class="text-slate-500 text-xs">vs sebelumnya</span>`;
        }

        function renderBarRow(label, value, maxValue, colorClass = 'bg-[#B6FF00]', extra = '') {
            const pct = maxValue ? Math.max(3, (value / maxValue) * 100) : 3;
            return `
            <div class="flex items-center gap-3 py-1.5">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1 gap-2">
                        <span class="text-xs text-white font-medium truncate">${label}</span>
                        <span class="text-xs font-bold text-slate-300 flex-shrink-0">${formatGANumber(value)}${extra}</span>
                    </div>
                    <div class="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                        <div class="${colorClass} h-full rounded-full transition-all duration-700" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>`;
        }

        function showGAAlert(msg) {
            const el = document.getElementById('ga-alert');
            const msgEl = document.getElementById('ga-alert-msg');
            if (el && msgEl) { msgEl.innerHTML = msg; el.classList.remove('hidden'); }
        }
        function hideGAAlert() {
            const el = document.getElementById('ga-alert');
            if (el) el.classList.add('hidden');
        }

        function setGALoaders(show) {
            ['ga-chart-visitors-loader', 'ga-chart-devices-loader'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = show ? 'flex' : 'none';
            });
        }

        function renderGAVisitorChart(labels, usersData, sessionsData) {
            const ctx = document.getElementById('ga-chart-visitors');
            if (!ctx) return;
            if (gaVisitorChart) { gaVisitorChart.destroy(); gaVisitorChart = null; }
            gaVisitorChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Pengguna',
                            data: usersData,
                            borderColor: '#B6FF00',
                            backgroundColor: 'rgba(182,255,0,0.08)',
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#B6FF00',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Sesi',
                            data: sessionsData,
                            borderColor: '#017A6B',
                            backgroundColor: 'rgba(1,122,107,0.06)',
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#017A6B',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 800 },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,24,0.92)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            titleColor: '#fff',
                            bodyColor: '#94a3b8',
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 8 }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: '#64748b', font: { size: 10 }, callback: v => formatGANumber(v) },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        function renderGADeviceChart(deviceData) {
            const ctx = document.getElementById('ga-chart-devices');
            const legend = document.getElementById('ga-device-legend');
            if (!ctx) return;
            if (gaDeviceChart) { gaDeviceChart.destroy(); gaDeviceChart = null; }

            const labels = deviceData.map(d => d.label);
            const values = deviceData.map(d => d.value);
            const total = values.reduce((a, b) => a + b, 0);
            const colors = ['#B6FF00', '#017A6B', '#818cf8', '#fbbf24', '#34d399'];

            gaDeviceChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors.slice(0, labels.length).map(c => c + 'cc'),
                        borderColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,24,0.92)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            callbacks: {
                                label: ctx => ` ${ctx.label}: ${formatGANumber(ctx.raw)} (${formatPct(ctx.raw, total)})`
                            }
                        }
                    }
                }
            });

            if (legend) {
                legend.innerHTML = deviceData.map((d, i) => `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:${colors[i]}"></span>
                            <span class="text-slate-300">${d.label}</span>
                        </div>
                        <span class="text-white font-bold">${formatPct(d.value, total)}</span>
                    </div>
                `).join('');
            }
        }

        function renderGAStats(data) {
            // --- KPI: Row 1 ---
            document.getElementById('ga-total-users').textContent = formatGANumber(data.totalUsers);
            document.getElementById('ga-users-change').innerHTML = renderChangeChip(data.usersChange);
            document.getElementById('ga-sessions').textContent = formatGANumber(data.sessions);
            document.getElementById('ga-sessions-change').innerHTML = renderChangeChip(data.sessionsChange);
            document.getElementById('ga-pageviews').textContent = formatGANumber(data.pageviews);
            document.getElementById('ga-pageviews-change').innerHTML = renderChangeChip(data.pageviewsChange);
            document.getElementById('ga-bounce').textContent = data.bounceRate != null ? parseFloat(data.bounceRate).toFixed(1) + '%' : '-';
            document.getElementById('ga-bounce-change').innerHTML = renderChangeChip(data.bounceChange);

            // --- KPI: Row 2 ---
            document.getElementById('ga-new-users').textContent = formatGANumber(data.newUsers);
            document.getElementById('ga-avg-duration').textContent = formatDuration(data.avgSessionDuration);
            document.getElementById('ga-returning-users').textContent = formatGANumber(data.returningUsers);
            const pps = data.sessions && data.pageviews ? (data.pageviews / data.sessions).toFixed(2) : '-';
            document.getElementById('ga-pages-per-session').textContent = pps;

            // --- Last updated ---
            const updated = document.getElementById('ga-last-updated');
            if (updated) updated.textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID');

            // --- Visitor Chart ---
            if (data.dailyTrend && data.dailyTrend.length) {
                const labels = data.dailyTrend.map(d => {
                    const dt = new Date(d.date);
                    return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                });
                const usersData = data.dailyTrend.map(d => d.users);
                const sessionsData = data.dailyTrend.map(d => d.sessions);
                renderGAVisitorChart(labels, usersData, sessionsData);
                document.getElementById('ga-chart-visitors-loader').style.display = 'none';
            }

            // --- Device Chart ---
            if (data.devices && data.devices.length) {
                renderGADeviceChart(data.devices);
                document.getElementById('ga-chart-devices-loader').style.display = 'none';
            }

            // --- Top Pages ---
            const tpEl = document.getElementById('ga-top-pages');
            if (tpEl && data.topPages && data.topPages.length) {
                const maxViews = Math.max(...data.topPages.map(p => p.views));
                tpEl.innerHTML = data.topPages.map(p =>
                    renderBarRow(p.page || '/', p.views, maxViews, 'bg-[#B6FF00]')
                ).join('');
            } else if (tpEl) {
                tpEl.innerHTML = '<div class="text-slate-400 text-xs italic text-center py-4">Tidak ada data halaman.</div>';
            }

            // --- Traffic Sources ---
            const tsEl = document.getElementById('ga-traffic-sources');
            if (tsEl && data.trafficSources && data.trafficSources.length) {
                const maxSrc = Math.max(...data.trafficSources.map(s => s.sessions));
                const srcColors = ['bg-[#B6FF00]', 'bg-[#017A6B]', 'bg-indigo-400', 'bg-amber-400', 'bg-rose-400', 'bg-sky-400'];
                tsEl.innerHTML = data.trafficSources.map((s, i) =>
                    renderBarRow(s.source || 'direct', s.sessions, maxSrc, srcColors[i % srcColors.length])
                ).join('');
            } else if (tsEl) {
                tsEl.innerHTML = '<div class="text-slate-400 text-xs italic text-center py-4">Tidak ada data sumber traffic.</div>';
            }

            // --- Top Countries ---
            const tcEl = document.getElementById('ga-top-countries');
            if (tcEl && data.topCountries && data.topCountries.length) {
                const maxC = Math.max(...data.topCountries.map(c => c.users));
                tcEl.innerHTML = data.topCountries.map(c =>
                    renderBarRow(`${c.flag || '🌏'} ${c.country}`, c.users, maxC, 'bg-[#B6FF00]')
                ).join('');
            } else if (tcEl) {
                tcEl.innerHTML = '<div class="text-slate-400 text-xs italic text-center py-4">Tidak ada data negara.</div>';
            }

            // --- Top Cities ---
            const tciEl = document.getElementById('ga-top-cities');
            if (tciEl && data.topCities && data.topCities.length) {
                const maxCi = Math.max(...data.topCities.map(c => c.users));
                tciEl.innerHTML = data.topCities.map(c =>
                    renderBarRow(c.city, c.users, maxCi, 'bg-[#017A6B]')
                ).join('');
            } else if (tciEl) {
                tciEl.innerHTML = '<div class="text-slate-400 text-xs italic text-center py-4">Tidak ada data kota.</div>';
            }

            lucide.createIcons();
        }

        function renderGASetupNotice() {
            // Show a friendly notice explaining how to enable the feature
            showGAAlert(`
                <div>
                    <p class="font-bold text-white mb-2">⚠️ Konfigurasi Backend Diperlukan</p>
                    <p class="text-slate-300 text-sm mb-3">Untuk menampilkan data Google Analytics langsung di sini, backend (Google Apps Script) perlu dikonfigurasi dengan Google Analytics Data API. Langkah-langkah:</p>
                    <ol class="list-decimal list-inside space-y-1.5 text-slate-400 text-xs">
                        <li>Buka <a href="https://console.cloud.google.com" target="_blank" class="text-[#B6FF00] underline">Google Cloud Console</a> — aktifkan <strong class="text-white">Google Analytics Data API</strong></li>
                        <li>Buat Service Account, download JSON key-nya</li>
                        <li>Di Google Analytics → Admin → Property → Property Access Management — tambahkan email service account dengan peran <em>Viewer</em></li>
                        <li>Di Google Apps Script, tambahkan action <code class="bg-[rgba(182,255,0,0.1)] px-1 rounded text-[#B6FF00]">get_ga_stats</code> yang memanggil Google Analytics Data API</li>
                        <li>Isi <strong class="text-white">GA4 Property ID</strong> di Pengaturan Sistem</li>
                    </ol>
                    <p class="mt-3 text-slate-400 text-xs">Sementara itu, kamu bisa memantau statistik langsung di <a href="https://analytics.google.com" target="_blank" class="text-[#B6FF00] underline">Google Analytics Dashboard</a>. Tag GA4 <code class="bg-[rgba(182,255,0,0.1)] px-1 rounded text-[#B6FF00]">G-GZM06L9YDH</code> sudah aktif di website kamu.</p>
                </div>
            `);
            setGALoaders(false);

            // Reset all KPI fields to show em dash
            ['ga-total-users','ga-sessions','ga-pageviews','ga-bounce','ga-new-users','ga-avg-duration','ga-returning-users','ga-pages-per-session'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '—';
            });
            ['ga-users-change','ga-sessions-change','ga-pageviews-change','ga-bounce-change'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<span class="text-slate-500 text-xs">Belum terhubung</span>';
            });
            ['ga-top-pages','ga-traffic-sources','ga-top-countries','ga-top-cities'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<div class="text-slate-500 text-xs italic text-center py-4">Konfigurasi backend diperlukan</div>';
            });

            const updated = document.getElementById('ga-last-updated');
            if (updated) updated.textContent = 'Perlu konfigurasi';
        }

        async function loadGAStats(forceRefresh = false) {
            const statsTab = document.getElementById('tab-stats');
            if (!statsTab || !statsTab.classList.contains('active')) return;

            hideGAAlert();
            setGALoaders(true);

            const refreshIcon = document.getElementById('ga-refresh-icon');
            if (refreshIcon) refreshIcon.classList.add('animate-spin');

            const days = parseInt(document.getElementById('ga-period')?.value || '30');

            try {
                const endpoint = getApiEndpoint();
                if (!endpoint) throw new Error('API endpoint tidak tersedia');

                const payload = buildAdminAuthPayload({
                    action: 'get_ga_stats',
                    ga_days: days
                });

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const rawText = await res.text();
                let data = {};
                try { data = JSON.parse(rawText); } catch (_) {}

                if (!res.ok) {
                    throw new Error(data.message || `HTTP ${res.status}`);
                }

                if (data.status === 'not_configured' || data.status === 'setup_required') {
                    renderGASetupNotice();
                    return;
                }

                if (data.status !== 'success') {
                    throw new Error(data.message || 'Gagal memuat statistik GA4');
                }

                renderGAStats(data.data || data);
                gaStatsLoaded = true;

            } catch (err) {
                const msg = err && err.message ? err.message : 'Gagal memuat data';

                // If action not found → show setup notice
                if (msg.includes('Unknown action') || msg.includes('not_configured') || msg.includes('404') || msg.includes('not supported')) {
                    renderGASetupNotice();
                } else {
                    setGALoaders(false);
                    showGAAlert(`<strong class="text-rose-400">Gagal memuat data:</strong> ${msg}.<br><span class="text-slate-400 text-xs">Pastikan backend mendukung action <code class="text-[#B6FF00]">get_ga_stats</code> dan GA4 sudah dikonfigurasi.</span>`);
                    const updated = document.getElementById('ga-last-updated');
                    if (updated) updated.textContent = 'Gagal dimuat';
                }
            } finally {
                if (refreshIcon) refreshIcon.classList.remove('animate-spin');
                setGALoaders(false);
            }
        }

    