const fs = require('fs');

let fileContent = fs.readFileSync('d:/Website/NextCuan/admin-area.html', 'utf8');

const targetFuncStart = 'function renderSalesChart(periodDays) {';
const targetFuncEnd = '// --- REAL SALES CHART IMPLEMENTATION END ---';

const startIndex = fileContent.indexOf(targetFuncStart);
const endIndex = fileContent.indexOf(targetFuncEnd);

if (startIndex !== -1 && endIndex !== -1) {
    let before = fileContent.substring(0, startIndex);
    let after = fileContent.substring(endIndex);
    
    let updatedFunc = `function renderSalesChart(periodDays) {
            const ctx = document.getElementById('salesChartCanvas');
            if(!ctx || !cachedAdminOrdersForChart) return;

            // Prepare Data Aggregation
            const daysToLookBack = periodDays === 'all' ? 3650 : parseInt(periodDays) || 7;
            const now = new Date();
            const dateMap = {};

            // Initialize date map for the period (Hari Ini starts at 1)
            let periodEnd = 0;
            if (periodDays !== 'all') {
                for(let i = daysToLookBack - 1; i >= periodEnd; i--) {
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

            // Aggregate Orders
            cachedAdminOrdersForChart.forEach(order => {
                let status = String(order[7] || '').trim().toLowerCase();
                let isLunas = status === 'lunas';
                let isPending = status === 'pending';
                let isBatal = status === 'batal' || status === 'gagal';
                
                let rev = parseFloat(order[6]) || 0;
                let komisi = parseFloat(order[10]) || 0;
                
                // Lifetime Stats
                lifetimeOrders++;
                if (isLunas) {
                    lifetimeRev += rev;
                    lifetimeKomisi += komisi;
                    
                    let pname = order[5] || 'Produk Lainnya';
                    if (!productSalesMap[pname]) {
                        productSalesMap[pname] = { count: 0, rev: 0 };
                    }
                    productSalesMap[pname].count++;
                    productSalesMap[pname].rev += rev;
                }

                let rawDate = order[8];
                let dateObj = new Date(rawDate);
                if(isNaN(dateObj.getTime())) return;
                
                let isoDate = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
                
                // Determine if in selected period
                let isWithinPeriod = false;
                if(periodDays === 'all') {
                    isWithinPeriod = true;
                } else {
                    if(dateObj >= cutoff) isWithinPeriod = true;
                }

                if(isWithinPeriod) {
                    sumOrders++;
                    if(isLunas) {
                        sumRev += rev;
                        sumLunas++;
                        sumKomisi += komisi;
                    } else if(isPending) {
                        sumPending++;
                    } else if(isBatal) {
                        sumBatal++;
                    }
                }

                if(periodDays === 'all' && !dateMap[isoDate]) {
                    dateMap[isoDate] = { 
                        lunas: { rev: 0, count: 0 },
                        pending: { rev: 0, count: 0 },
                        batal: { rev: 0, count: 0 }
                    };
                }

                if(dateMap[isoDate]) {
                    if (isLunas) {
                        dateMap[isoDate].lunas.rev += rev;
                        dateMap[isoDate].lunas.count += 1;
                    } else if (isPending) {
                        dateMap[isoDate].pending.rev += rev;
                        dateMap[isoDate].pending.count += 1;
                    } else if (isBatal) {
                        dateMap[isoDate].batal.rev += rev;
                        dateMap[isoDate].batal.count += 1;
                    }
                }
            });

            // Update Left Sidebar Cards (Period Filtered)
            let nf = new Intl.NumberFormat('id-ID');
            document.getElementById('chart-sum-revenue').innerText = 'Rp ' + nf.format(sumRev);
            document.getElementById('chart-sum-orders').innerText = nf.format(sumOrders);
            document.getElementById('chart-sum-lunas').innerText = nf.format(sumLunas);
            document.getElementById('chart-sum-pending').innerText = nf.format(sumPending);
            document.getElementById('chart-sum-batal').innerText = nf.format(sumBatal);
            document.getElementById('chart-sum-komisi').innerText = 'Rp ' + nf.format(sumKomisi);

            // Update Top Level Cards (Lifetime)
            document.getElementById('stat-rev').innerText = 'Rp ' + nf.format(lifetimeRev);
            document.getElementById('stat-orders').innerText = nf.format(lifetimeOrders);
            document.getElementById('stat-komisi').innerText = 'Rp ' + nf.format(lifetimeKomisi);
            
            // Render Product Table
            let productListEl = document.getElementById('list-product-sales');
            if (productListEl) {
                let sortedProducts = Object.keys(productSalesMap).map(k => {
                    return { name: k, count: productSalesMap[k].count, rev: productSalesMap[k].rev };
                }).sort((a, b) => b.count - a.count); // desc by count
                
                if (sortedProducts.length > 0) {
                    let html = '';
                    sortedProducts.forEach(p => {
                        html += \\\`<tr class="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white" data-label="Produk"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-[rgba(182,255,0,0.1)] flex items-center justify-center text-[#B6FF00] border border-[rgba(182,255,0,0.2)]"><i data-lucide="package" class="w-4 h-4"></i></div>\\\${p.name}</div></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300 text-left md:text-center font-bold" data-label="Terjual">\\\${p.count}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-[#B6FF00] text-left md:text-right font-bold tracking-wider font-mono" data-label="Total Pendapatan (IDR)">Rp \\\${nf.format(p.rev)}</td>
                        </tr>\\\`;
                    });
                    productListEl.innerHTML = html;
                    if(typeof lucide !== 'undefined') lucide.createIcons();
                } else {
                    productListEl.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400 text-xs italic">Belum ada penjualan lunas.</td></tr>';
                }
            }

            // Format Labels & Data Arrays for Chart
            const sortedDates = Object.keys(dateMap).sort();
            const labels = [];
            
            const dataRevLunas = [];
            const dataCountLunas = [];
            const dataRevPending = [];
            const dataCountPending = [];
            const dataRevBatal = [];
            const dataCountBatal = [];
            
            sortedDates.forEach(dt => {
                const dObj = new Date(dt);
                labels.push(dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
                
                dataRevLunas.push(dateMap[dt].lunas.rev);
                dataCountLunas.push(dateMap[dt].lunas.count);
                
                dataRevPending.push(dateMap[dt].pending.rev);
                dataCountPending.push(dateMap[dt].pending.count);
                
                dataRevBatal.push(dateMap[dt].batal.rev);
                dataCountBatal.push(dateMap[dt].batal.count);
            });

            if(adminSalesChartInstance) {
                adminSalesChartInstance.destroy();
            }

            adminSalesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Lunas',
                            data: dataRevLunas,
                            orderCountData: dataCountLunas,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#000018',
                            pointBorderColor: '#10b981',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Pending',
                            data: dataRevPending,
                            orderCountData: dataCountPending,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#000018',
                            pointBorderColor: '#f59e0b',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Batal',
                            data: dataRevBatal,
                            orderCountData: dataCountBatal,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#000018',
                            pointBorderColor: '#ef4444',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    layout: { 
                        padding: 0 
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top', 
                            align: 'end',
                            labels: {
                                color: '#94a3b8',
                                font: { family: "'Inter', sans-serif", size: 11, weight: 'bold' },
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(5, 5, 20, 0.95)',
                            titleFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                            bodyFont: { family: "'Inter', sans-serif", size: 13, weight: '500' },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) {
                                    if(context && context.length > 0) {
                                        let originalIso = sortedDates[context[0].dataIndex];
                                        let parts = originalIso.split('-');
                                        return 'Tanggal: ' + parts[2] + '/' + parts[1] + '/' + parts[0];
                                    }
                                    return '';
                                },
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    let rv = context.parsed.y;
                                    let revStr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(rv);
                                    let countStr = context.dataset.orderCountData[context.dataIndex];
                                    
                                    return label + ': Rp ' + revStr + ' (' + countStr + ' Pesanan)';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            offset: false,
                            grid: { display: false, drawBorder: false },
                            ticks: { 
                                align: 'inner', // Menghilangkan spacer label x agar full mentok kanan/kiri
                                font: { family: "'Inter', sans-serif", size: 11 }, 
                                color: '#64748b',
                                maxRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 12
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false, borderDash: [5, 5] },
                            ticks: { 
                                font: { family: "'Inter', sans-serif", size: 11 }, 
                                color: '#64748b',
                                callback: function(value) {
                                    if(value >= 1000000) return 'Rp ' + (value/1000000).toFixed(1).replace(/\\.0$/, '') + 'jt';
                                    if(value >= 1000) return 'Rp ' + (value/1000).toFixed(1).replace(/\\.0$/, '') + 'k';
                                    return 'Rp ' + value;
                                },
                                maxTicksLimit: 6
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                }
            });
        }
        `;
    
    fileContent = before + updatedFunc + "\n        " + after;
    fs.writeFileSync('d:/Website/NextCuan/admin-area.html', fileContent, 'utf8');
    console.log("chart updated successfully");
} else {
    console.log("Function text not found properly.");
}
