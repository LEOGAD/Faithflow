/**
 * Income Module Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('incomeTableBody');
    const openModalBtn = document.querySelector('.header-actions .btn-primary');
    const modal = document.getElementById('addIncomeModal');
    const closeBtn = document.getElementById('closeAddIncomeBtn');
    const form = document.getElementById('addIncomeForm');
    
    const kpiTotal = document.getElementById('kpiTotalIncome');
    const kpiAvg = document.getElementById('kpiAvgIncome');
    
    // Sync with settings
    window.addEventListener('settingsUpdated', () => {
        console.log('Income Module: Syncing with new settings...');
        populateDropdowns();
    });
    
    // Dropdowns
    const incCategorySelect = document.getElementById('incCategory');
    const filterCategorySelect = document.querySelectorAll('.filter-bar select')[1];
    const filterServiceSelect = document.querySelectorAll('.filter-bar select')[0];
    
    let incomeData = [];

    // Open Modal
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    
    // Close Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
        });
    }
    
    // Handle Form Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newRecord = {
                date: document.getElementById('incDate').value,
                name: document.getElementById('incName').value || 'Anonymous',
                category: document.getElementById('incCategory').value,
                amount: parseFloat(document.getElementById('incAmount').value)
            };
            
            try {
                await apiCall('/income/create', 'POST', newRecord);
                modal.classList.remove('active');
                form.reset();
                await fetchData();
            } catch (err) {
                alert('Error saving record: ' + err.message);
            }
        });
    }

    // Make delete globally accessible
    window.deleteIncome = async (id) => {
        if(confirm('Are you sure you want to delete this record?')) {
            try {
                await apiCall(`/income/delete/${id}`, 'DELETE');
                await fetchData();
            } catch(err) {
                alert('Error deleting record: ' + err.message);
            }
        }
    };

    window.editIncome = async (id, currentAmount) => {
        const newAmt = prompt('Enter new amount:', currentAmount);
        if(newAmt !== null && newAmt.trim() !== '' && !isNaN(newAmt)) {
            try {
                await apiCall(`/income/update/${id}`, 'PUT', { amount: parseFloat(newAmt) });
                await fetchData();
            } catch(err) {
                alert('Error updating record: ' + err.message);
            }
        }
    };
    
    // Populate Dropdowns dynamically
    function populateDropdowns() {
        if (!window.appSettings) return;
        
        // Categories
        const categories = window.appSettings.income_categories || [];
        if (incCategorySelect) {
            incCategorySelect.innerHTML = categories.filter(c => c.active).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
        if (filterCategorySelect) {
            filterCategorySelect.innerHTML = '<option value="">All Categories</option>' + categories.filter(c => c.active).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
        
        // Services
        const services = window.appSettings.services || [];
        if (filterServiceSelect) {
            filterServiceSelect.innerHTML = '<option value="">All Services</option>' + services.filter(s => s.active && s.trackFinance).map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        
        // Re-render table to apply correct badge colors if they changed
        renderTable();
    }
    
    window.addEventListener('settingsUpdated', populateDropdowns);
    
    // Render Table
    function renderTable() {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (incomeData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No income records found for this period.</td></tr>`;
            return;
        }
        
        incomeData.forEach(record => {
            const tr = document.createElement('tr');
            
            // Badge color based on dynamic category
            let badgeClass = 'badge-primary';
            tr.innerHTML = `
                <td>${row.date}</td>
                <td>${row.name}</td>
                <td><span class="status-badge" style="background:var(--bg-light); color:var(--primary);">${row.category}</span></td>
                <td><strong>${formatCurrency(row.amount)}</strong></td>
                <td>
                    <button class="btn-icon" onclick="editIncome('${row.id}', ${row.amount})"><span class="material-symbols-outlined">edit</span></button>
                    <button class="btn-icon text-danger" onclick="deleteIncome('${row.id}')"><span class="material-symbols-outlined">delete</span></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        
        if (kpiTotal) kpiTotal.textContent = formatCurrency(total);
        if (kpiAvg) kpiAvg.textContent = formatCurrency(incomeData.length > 0 ? total / incomeData.length : 0);
    }
    
    // Update KPI Cards
    function updateKPIs() {
        if (!kpiTotal || !kpiAvg) return;
        
        const total = incomeData.reduce((sum, rec) => sum + rec.amount, 0);
        const avg = incomeData.length > 0 ? total / incomeData.length : 0;
        
        kpiTotal.textContent = formatCurrency(total);
        kpiAvg.textContent = formatCurrency(avg);
    }
    
    // Fetch from API
    async function fetchData() {
        try {
            incomeData = await apiCall('/income/list');
            renderTable();
            updateKPIs();
        } catch (err) {
            console.error('Failed to load income:', err);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load data.</td></tr>`;
        }
    }

    // Init
    fetchData();
    if(window.appSettings) populateDropdowns();
});
