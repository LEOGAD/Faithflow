/**
 * Dashboard Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const kpiIncome = document.getElementById('kpiDashIncome');
    const kpiExpenses = document.getElementById('kpiDashExpenses');
    const kpiBalance = document.getElementById('kpiDashBalance');
    const kpiAttendance = document.getElementById('kpiDashAttendance');
    const kpiAttBadge = document.getElementById('kpiDashAttBadge');
    
    // Listen for global settings updates
    window.addEventListener('settingsUpdated', () => {
        updateDashboard();
    });

    async function updateDashboard() {
        try {
            console.log('Refreshing dashboard...');
            const reportData = await apiCall('/reports/monthly');
            const { financials, attendance } = reportData;
            
            // Update Financial KPI Cards with Global Formatter
            if (kpiIncome) kpiIncome.textContent = formatCurrency(financials.totalIncome);
            if (kpiExpenses) kpiExpenses.textContent = formatCurrency(financials.totalExpenses);
            if (kpiBalance) kpiBalance.textContent = formatCurrency(financials.balance);
            
            // Calculate Avg Attendance
            let totalAtt = 0;
            let count = 0;
            Object.values(attendance).forEach(val => {
                totalAtt += val;
                count++;
            });
            const avgAtt = count > 0 ? Math.round(totalAtt / count) : 0;
            
            if (kpiAttendance) kpiAttendance.textContent = avgAtt.toLocaleString();
            
            // Populate Dynamic Fund Allocation
            const fundAllocationList = document.getElementById('fundAllocationList');
            if (fundAllocationList) {
                if (financials.totalIncome === 0 || Object.keys(financials.incomeByCategory).length === 0) {
                    fundAllocationList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); font-size: 0.875rem;">No allocation data</p>`;
                } else {
                    let allocationHtml = '';
                    for (const [category, amount] of Object.entries(financials.incomeByCategory)) {
                        const percentage = Math.round((amount / financials.totalIncome) * 100);
                        allocationHtml += `
                            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
                                <span>${category}</span>
                                <strong>${percentage}%</strong>
                            </div>
                        `;
                    }
                    fundAllocationList.innerHTML = allocationHtml;
                }
            }
            
        } catch(err) {
            console.error("Dashboard error:", err);
            if (kpiIncome) kpiIncome.textContent = 'Error';
            if (kpiExpenses) kpiExpenses.textContent = 'Error';
            if (kpiBalance) kpiBalance.textContent = 'Error';
        }
    }
    
    // Init
    updateDashboard();
});
