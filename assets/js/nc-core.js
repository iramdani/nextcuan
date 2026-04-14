/**
 * NextCuan Core JavaScript
 * Global functions for Download Management & Auth
 */

async function ncDownload(id, event) {
    // Determine the target element for loading states
    const btn = (event && event.currentTarget) ? event.currentTarget : (window.event && window.event.currentTarget ? window.event.currentTarget : null);
    const originalContent = btn ? btn.innerHTML : null;
    
    const email = localStorage.getItem('userEmail') || '';
    if (!email) {
        alert('Silakan login terlebih dahulu untuk mengakses file ini.');
        return;
    }

    if (btn) {
        btn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyiapkan File...</span>';
        btn.disabled = true;
    }

    try {
        const apiEndpoint = typeof getApiEndpoint === 'function' ? getApiEndpoint() : (window.SCRIPT_URL || localStorage.getItem('gas_endpoint') || '');
        
        if (!apiEndpoint || apiEndpoint.includes('MASUKKAN_URL')) {
            throw new Error('Konfigurasi API Endpoint (gas_endpoint) belum diatur.');
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS prefers text/plain for avoid preflight sometimes, but JSON is also fine
            body: JSON.stringify({
                action: 'download_file',
                email: email,
                file_id: id
            })
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch(e) { throw new Error('Respon server tidak valid.'); }

        if (data.status === 'success') {
            // Success: Direct to download link
            window.location.href = data.url;
            
            if (btn) {
                btn.innerHTML = '<span class="flex items-center justify-center gap-2">✅ Siap Download</span>';
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                }, 3000);
            }
        } else {
            throw new Error(data.message || 'Akses ditolak oleh server.');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Gagal: ' + error.message);
        if (btn && originalContent) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

// Global helper for API Endpoint
if (typeof getApiEndpoint !== 'function') {
    window.getApiEndpoint = function() {
        return window.SCRIPT_URL || localStorage.getItem('gas_endpoint') || ''; 
    };
}
