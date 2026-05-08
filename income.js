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
            const catDef = window.appSettings?.income_categories?.find(c => c.name === record.category);
            let badgeStyle = catDef ? `background:${catDef.color}; color:#fff;` : '';
            
            tr.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td><strong>${record.name || 'Anonymous'}</strong></td>
                <td><span class="badge ${!catDef ? badgeClass : ''}" style="${badgeStyle}">${record.category}</span></td>
                <td>General</td>
                <td style="text-align: right;">
                    <strong>${formatCurrency(record.amount)}</strong>
                    <span class="material-symbols-outlined" onclick="editIncome('${record.id}', '${record.amount}')" style="font-size: 16px; cursor: pointer; color: var(--primary); margin-left: 10px; vertical-align: middle;">edit</span>
                    <span class="material-symbols-outlined" onclick="deleteIncome('${record.id}')" style="font-size: 16px; cursor: pointer; color: var(--danger); margin-left: 5px; vertical-align: middle;">delete</span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
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
