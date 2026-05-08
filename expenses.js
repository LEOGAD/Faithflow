/**
 * Expenses Module Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('expensesTableBody');
    const openModalBtn = document.querySelector('.header-actions .btn-primary');
    const modal = document.getElementById('addExpenseModal');
    const closeBtn = document.getElementById('closeAddExpenseBtn');
    const form = document.getElementById('addExpenseForm');
    
    const kpiTotal = document.getElementById('kpiTotalExpense');
    const kpiPendingBills = document.getElementById('kpiPendingBills');
    const kpiPendingCount = document.getElementById('kpiPendingCount');
    
    // Dropdowns
    const expCategorySelect = document.getElementById('expCategory');
    
    let expensesData = [];

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
                date: document.getElementById('expDate').value,
                description: document.getElementById('expPayee').value, // mapping payee to description
                category: document.getElementById('expCategory').value,
                status: document.getElementById('expStatus').value,
                amount: parseFloat(document.getElementById('expAmount').value)
            };
            
            try {
                await apiCall('/expenses/create', 'POST', newRecord);
                modal.classList.remove('active');
                form.reset();
                await fetchData();
            } catch (err) {
                alert('Error saving record: ' + err.message);
            }
        });
    }

    // Make delete globally accessible
    window.deleteExpense = async (id) => {
        if(confirm('Are you sure you want to delete this expense?')) {
            try {
                await apiCall(`/expenses/delete/${id}`, 'DELETE');
                await fetchData();
            } catch(err) {
                alert('Error deleting record: ' + err.message);
            }
        }
    };

    window.editExpense = async (id, currentAmount) => {
        const newAmt = prompt('Enter new amount:', currentAmount);
        if(newAmt !== null && newAmt.trim() !== '' && !isNaN(newAmt)) {
            try {
                await apiCall(`/expenses/update/${id}`, 'PUT', { amount: parseFloat(newAmt) });
                await fetchData();
            } catch(err) {
                alert('Error updating record: ' + err.message);
            }
        }
    };
    
    // Populate Dropdowns dynamically
    function populateDropdowns() {
        if (!window.appSettings) return;
        
        const categories = window.appSettings.expense_categories || [];
        if (expCategorySelect) {
            expCategorySelect.innerHTML = categories.filter(c => c.active).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
        
        // Re-render table to apply correct badge colors if they changed
        renderTable();
    }
    
    window.addEventListener('settingsUpdated', populateDropdowns);
    
    // Render Table
    function renderTable() {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (expensesData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No expense records found.</td></tr>`;
            return;
        }
        
        expensesData.forEach(record => {
            const tr = document.createElement('tr');
            
            // Badge color based on dynamic category
            let catBadge = 'badge-primary';
            const catDef = window.appSettings?.expense_categories?.find(c => c.name === record.category);
            let badgeStyle = catDef ? `background:${catDef.color}; color:#fff;` : '';
            
            // Note: Since we didn't add status to backend schema directly in instructions but allowed open fields, it's there
            let statusBadge = record.status === 'Paid' ? 'badge-success' : 'badge-warning';
            
            tr.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td><strong>${record.description}</strong></td>
                <td><span class="badge ${!catDef ? catBadge : ''}" style="${badgeStyle}">${record.category}</span></td>
                <td><span class="badge ${statusBadge}">${record.status || 'Paid'}</span></td>
                <td style="text-align: right;">
                    <strong>${formatCurrency(record.amount)}</strong>
                    <span class="material-symbols-outlined" onclick="editExpense('${record.id}', '${record.amount}')" style="font-size: 16px; cursor: pointer; color: var(--primary); margin-left: 10px; vertical-align: middle;">edit</span>
                    <span class="material-symbols-outlined" onclick="deleteExpense('${record.id}')" style="font-size: 16px; cursor: pointer; color: var(--danger); margin-left: 5px; vertical-align: middle;">delete</span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    // Update KPI Cards
    function updateKPIs() {
        if (!kpiTotal || !kpiPendingBills) return;
        
        const total = expensesData.reduce((sum, rec) => sum + rec.amount, 0);
        
        const pending = expensesData.filter(rec => rec.status === 'Pending');
        const pendingSum = pending.reduce((sum, rec) => sum + rec.amount, 0);
        
        kpiTotal.textContent = formatCurrency(total);
        kpiPendingBills.textContent = formatCurrency(pendingSum);
        if(kpiPendingCount) kpiPendingCount.textContent = `${pending.length} Due`;
    }
    
    // Fetch from API
    async function fetchData() {
        try {
            expensesData = await apiCall('/expenses/list');
            renderTable();
            updateKPIs();
        } catch (err) {
            console.error('Failed to load expenses:', err);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load data.</td></tr>`;
        }
    }

    // Init
    fetchData();
    if(window.appSettings) populateDropdowns();
});
