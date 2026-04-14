/**
 * NextCuan Core JavaScript
 * Global functions for Download Management & Auth
 */

async function ncDownload(id) {
    const email = localStorage.getItem('userEmail') || '';
    if (!email) {
        alert('Silakan login terlebih dahulu untuk mengakses file ini.');
        // Opsi: window.location.href = 'login.html';
        return;
    }

    // Ambil elemen tombol yang diklik
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    
    // Efek loading pada tombol
    btn.innerHTML = '<span class="flex items-center justify-center gap-2"><i class="animate-spin opacity-50">...</i> Loading</span>';
    btn.disabled = true;

    try {
        // Panggil backend NextCuan
        // URL Apps Script diambil dari variabel global jika ada, jika tidak pakai default
        const apiEndpoint = typeof getApiEndpoint === 'function' ? getApiEndpoint() : '';
        
        if (!apiEndpoint) {
            console.error('API Endpoint tidak terdefinisi.');
            alert('Terjadi kesalahan konfigurasi sistem.');
            return;
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: JSON.stringify({
                action: 'download_file',
                email: email,
                file_id: id
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Berhasil: Langsung arahkan ke link download
            // Kita gunakan window.location.href agar browser menangani proses download-nya
            window.location.href = data.url;
            
            // Beri feedback sukses singkat sebelum tombol normal kembali
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }, 2000);
        } else {
            alert('Akses Ditolak: ' + data.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Gagal menghubungi server. Periksa koneksi internet Anda.');
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

// Helper untuk mendapatkan API Endpoint (Pastikan ini sesuai dengan URL Apps Script Anda)
if (typeof getApiEndpoint !== 'function') {
    window.getApiEndpoint = function() {
        // Coba ambil dari localStorage atau variabel lain, atau hardcode di sini
        return localStorage.getItem('gas_endpoint') || ''; 
    };
}
