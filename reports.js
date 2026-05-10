/**
 * Reports Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const repRev = document.getElementById('repRev');
    const repExp = document.getElementById('repExp');
    const repNet = document.getElementById('repNet');
    
    const filterTimeframe = document.getElementById('filterTimeframe');
    const filterPeriod = document.getElementById('filterPeriod');
    const filterReportType = document.getElementById('filterReportType');
    const periodGroup = document.getElementById('periodGroup');
    const generateBtn = document.getElementById('generateReportBtn');
    
    let availableData = { years: [], months: [] };

    // Download button
    const downloadBtn = document.querySelector('.header-actions .btn-primary');
    if (downloadBtn) {
        downloadBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">download</span> Download PDF';
        downloadBtn.addEventListener('click', async () => {
            downloadBtn.innerHTML = 'Generating...';
            downloadBtn.disabled = true;
            try {
                const payload = {
                    timeframe: filterTimeframe.value,
                    periodValue: filterPeriod.value,
                    reportType: filterReportType.value
                };
                const res = await apiCall('/reports/generate-pdf', 'POST', payload);
                if (res.url) window.open(res.url, '_blank');
            } catch(err) {
                alert('Error generating PDF: ' + err.message);
            }
            downloadBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">download</span> Download PDF';
            downloadBtn.disabled = false;
        });
    }

    async function loadAvailablePeriods() {
        try {
            availableData = await apiCall('/reports/available-periods');
            updatePeriodDropdown();
        } catch(err) {
            console.error('Failed to load periods', err);
        }
    }

    function updatePeriodDropdown() {
        const tf = filterTimeframe.value;
        filterPeriod.innerHTML = '';
        
        if (tf === 'weekly') {
            periodGroup.style.display = 'none';
            return;
        }
        
        periodGroup.style.display = 'block';
        
        if (tf === 'monthly') {
            if (availableData.months.length === 0) {
                filterPeriod.innerHTML = '<option value="">No data available</option>';
            } else {
                availableData.months.forEach(m => {
                    const [y, mo] = m.split('-');
                    const date = new Date(y, parseInt(mo)-1);
                    const monthName = date.toLocaleString('default', { month: 'long' });
                    filterPeriod.innerHTML += `<option value="${m}">${monthName} ${y}</option>`;
                });
            }
        } else if (tf === 'quarterly') {
            if (availableData.years.length === 0) {
                filterPeriod.innerHTML = '<option value="">No data available</option>';
            } else {
                availableData.years.forEach(y => {
                    filterPeriod.innerHTML += `<option value="${y}-Q4">Q4 (Oct-Dec) ${y}</option>`;
                    filterPeriod.innerHTML += `<option value="${y}-Q3">Q3 (Jul-Sep) ${y}</option>`;
                    filterPeriod.innerHTML += `<option value="${y}-Q2">Q2 (Apr-Jun) ${y}</option>`;
                    filterPeriod.innerHTML += `<option value="${y}-Q1">Q1 (Jan-Mar) ${y}</option>`;
                });
            }
        } else if (tf === 'yearly') {
            if (availableData.years.length === 0) {
                filterPeriod.innerHTML = '<option value="">No data available</option>';
            } else {
                availableData.years.forEach(y => {
                    filterPeriod.innerHTML += `<option value="${y}">${y}</option>`;
                });
            }
        }
    }

    filterTimeframe.addEventListener('change', updatePeriodDropdown);

    generateBtn.addEventListener('click', async () => {
        generateBtn.innerHTML = '<span class="material-symbols-outlined">autorenew</span> Generating...';
        generateBtn.disabled = true;
        try {
            const payload = {
                timeframe: filterTimeframe.value,
                periodValue: filterPeriod.value,
                reportType: filterReportType.value
            };
            const reportData = await apiCall('/reports/generate', 'POST', payload);
            renderReport(reportData);
        } catch(err) {
            console.error('Reports Error:', err);
            alert('Failed to generate report');
        }
        generateBtn.innerHTML = '<span class="material-symbols-outlined">autorenew</span> Generate Report';
        generateBtn.disabled = false;
    });

    function renderReport(data) {
        const { financials, reportType } = data;
        
        if (['full', 'financial', 'offering', 'tithe'].includes(reportType)) {
            if(repRev) {
                let lbl = 'Total Revenue';
                if(reportType === 'offering') lbl = 'Total Offering';
                if(reportType === 'tithe') lbl = 'Total Tithe';
                repRev.innerHTML = `${formatCurrency(financials.totalIncome)} <span style="font-size: 0.875rem; font-weight: normal; color: var(--success);">(${lbl})</span>`;
            }
            if(repExp) repExp.innerHTML = `${formatCurrency(financials.totalExpenses)} <span style="font-size: 0.875rem; font-weight: normal; color: var(--danger);">(Total Expenses)</span>`;
            if(repNet) repNet.textContent = formatCurrency(financials.balance);
        } else if (reportType === 'attendance') {
            if(repRev) repRev.innerHTML = `N/A <span style="font-size: 0.875rem; font-weight: normal; color: var(--text-secondary);">(Attendance Only)</span>`;
            if(repExp) repExp.innerHTML = `N/A <span style="font-size: 0.875rem; font-weight: normal; color: var(--text-secondary);">(Attendance Only)</span>`;
            if(repNet) repNet.textContent = 'N/A';
        }
    }
    
    // Initial Load
    loadAvailablePeriods().then(() => {
        if(generateBtn) generateBtn.click();
    });
});
