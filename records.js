/**
 * Records (Members) Module Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('recordsTableBody');
    const openModalBtn = document.querySelector('.header-actions .btn-primary');
    const modal = document.getElementById('addMemberModal');
    const closeBtn = document.getElementById('closeAddMemberBtn');
    const form = document.getElementById('addMemberForm');
    
    const kpiTotal = document.getElementById('kpiTotalMembers');
    const kpiNew = document.getElementById('kpiNewMembers');
    
    let membersData = [];

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
                name: document.getElementById('memName').value,
                status: document.getElementById('memStatus').value,
                email: document.getElementById('memEmail').value,
                phone: document.getElementById('memPhone').value || 'N/A',
                joinDate: document.getElementById('memJoinDate').value
            };
            
            try {
                await apiCall('/members/create', 'POST', newRecord);
                modal.classList.remove('active');
                form.reset();
                await fetchData();
            } catch (err) {
                alert('Error saving record: ' + err.message);
            }
        });
    }

    // Make delete globally accessible
    window.deleteMember = async (id) => {
        if(confirm('Are you sure you want to remove this member?')) {
            try {
                await apiCall(`/members/delete/${id}`, 'DELETE');
                await fetchData();
            } catch(err) {
                alert('Error deleting record: ' + err.message);
            }
        }
    };

    window.editMember = async (id, currentStatus) => {
        const newStatus = prompt('Enter new status (Active, Visitor, Inactive):', currentStatus);
        if(newStatus !== null && newStatus.trim() !== '') {
            try {
                await apiCall(`/members/update/${id}`, 'PUT', { status: newStatus });
                await fetchData();
            } catch(err) {
                alert('Error updating record: ' + err.message);
            }
        }
    };
    
    // Render Table
    function renderTable() {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (membersData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No member records found.</td></tr>`;
            return;
        }
        
        membersData.forEach(record => {
            const tr = document.createElement('tr');
            
            let statusBadge = 'badge-primary';
            if (record.status === 'Active') statusBadge = 'badge-success';
            if (record.status === 'Inactive') statusBadge = 'badge-warning';
            
            const joinFormatted = record.joinDate ? new Date(record.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A';
            
            tr.innerHTML = `
                <td><strong>${record.name}</strong></td>
                <td><span class="badge ${statusBadge}">${record.status}</span></td>
                <td>${record.email}</td>
                <td>${record.phone}</td>
                <td style="text-align: right;">
                    ${joinFormatted}
                    <span class="material-symbols-outlined" onclick="editMember('${record.id}', '${record.status}')" style="font-size: 16px; cursor: pointer; color: var(--primary); margin-left: 10px; vertical-align: middle;">edit</span>
                    <span class="material-symbols-outlined" onclick="deleteMember('${record.id}')" style="font-size: 16px; cursor: pointer; color: var(--danger); margin-left: 5px; vertical-align: middle;">delete</span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    // Update KPI Cards
    function updateKPIs() {
        if (!kpiTotal || !kpiNew) return;
        
        kpiTotal.textContent = membersData.length;
        
        const now = new Date();
        const newThisMonth = membersData.filter(m => {
            if(!m.joinDate) return false;
            const jd = new Date(m.joinDate);
            return jd.getMonth() === now.getMonth() && jd.getFullYear() === now.getFullYear();
        });
        
        kpiNew.textContent = newThisMonth.length;
    }
    
    // Fetch from API
    async function fetchData() {
        try {
            membersData = await apiCall('/members/list');
            renderTable();
            updateKPIs();
        } catch (err) {
            console.error('Failed to load members:', err);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load data.</td></tr>`;
        }
    }

    // Init
    fetchData();
});
