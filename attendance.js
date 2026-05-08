/**
 * Attendance Module Logic (API Connected)
 */

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('attendanceTableBody');
    const openModalBtn = document.querySelector('.header-actions .btn-primary');
    const modal = document.getElementById('addAttendanceModal');
    const closeBtn = document.getElementById('closeAddAttendanceBtn');
    const form = document.getElementById('addAttendanceForm');
    
    const kpiAvg = document.getElementById('kpiAvgAttendance');
    const kpiChildren = document.getElementById('kpiChildren');
    const kpiGuests = document.getElementById('kpiGuests');
    
    // Dropdowns
    const attServiceSelect = document.getElementById('attService');
    
    let attendanceData = [];

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
            
            const adults = parseInt(document.getElementById('attAdults').value) || 0;
            const children = parseInt(document.getElementById('attChildren').value) || 0;
            const guests = parseInt(document.getElementById('attGuests').value) || 0;
            const total = adults + children;
            
            const newRecord = {
                date: document.getElementById('attDate').value,
                service_name: document.getElementById('attService').value,
                count: total, // we'll use count for total and also pass raw details
                adults, children, guests
            };
            
            try {
                await apiCall('/attendance/create', 'POST', newRecord);
                modal.classList.remove('active');
                form.reset();
                await fetchData();
            } catch (err) {
                alert('Error saving record: ' + err.message);
            }
        });
    }

    // Make delete globally accessible
    window.deleteAttendance = async (id) => {
        if(confirm('Are you sure you want to delete this log?')) {
            try {
                await apiCall(`/attendance/delete/${id}`, 'DELETE');
                await fetchData();
            } catch(err) {
                alert('Error deleting record: ' + err.message);
            }
        }
    };

    window.editAttendance = async (id, currentCount) => {
        const newCount = prompt('Enter new total attendance count:', currentCount);
        if(newCount !== null && newCount.trim() !== '' && !isNaN(newCount)) {
            try {
                await apiCall(`/attendance/update/${id}`, 'PUT', { count: parseInt(newCount) });
                await fetchData();
            } catch(err) {
                alert('Error updating record: ' + err.message);
            }
        }
    };
    
    // Populate Dropdowns dynamically
    function populateDropdowns() {
        if (!window.appSettings) return;
        
        const services = window.appSettings.services || [];
        if (attServiceSelect) {
            const options = services
                .filter(s => s.active && s.trackAttendance)
                .map(s => `<option value="${s.name}">${s.name}</option>`)
                .join('');
            
            attServiceSelect.innerHTML = `<option value="">-- Select Service --</option>` + options;
            
            if (options === '') {
                console.warn('No active services found with trackAttendance enabled');
            }
        }
    }
    
    window.addEventListener('settingsUpdated', populateDropdowns);
    
    // Render Table
    function renderTable() {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (attendanceData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No attendance records found.</td></tr>`;
            return;
        }
        
        attendanceData.forEach(record => {
            const tr = document.createElement('tr');
            
            let srvBadge = 'badge-primary';
            if (record.service_name === 'Midweek Service') srvBadge = 'badge-warning';
            if (record.service_name === 'Youth Service') srvBadge = 'badge-success';
            
            tr.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td><span class="badge ${srvBadge}">${record.service_name}</span></td>
                <td>${record.adults || '-'}</td>
                <td>${record.children || '-'}</td>
                <td style="text-align: right;">
                    <strong>${record.count}</strong>
                    <span class="material-symbols-outlined" onclick="editAttendance('${record.id}', '${record.count}')" style="font-size: 16px; cursor: pointer; color: var(--primary); margin-left: 10px; vertical-align: middle;">edit</span>
                    <span class="material-symbols-outlined" onclick="deleteAttendance('${record.id}')" style="font-size: 16px; cursor: pointer; color: var(--danger); margin-left: 5px; vertical-align: middle;">delete</span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    // Update KPI Cards
    function updateKPIs() {
        if (!kpiAvg || !kpiChildren || !kpiGuests) return;
        
        if (attendanceData.length === 0) {
            kpiAvg.textContent = "0";
            kpiChildren.textContent = "0";
            kpiGuests.textContent = "0";
            return;
        }
        
        const totalSum = attendanceData.reduce((sum, rec) => sum + rec.count, 0);
        const avg = Math.round(totalSum / attendanceData.length);
        const recent = attendanceData[0]; // Already sorted DESC by backend
        
        kpiAvg.textContent = avg.toLocaleString();
        kpiChildren.textContent = (recent.children || 0).toLocaleString();
        kpiGuests.textContent = (recent.guests || 0).toLocaleString();
    }
    
    // Fetch from API
    async function fetchData() {
        try {
            attendanceData = await apiCall('/attendance/list');
            renderTable();
            updateKPIs();
        } catch (err) {
            console.error('Failed to load attendance:', err);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load data.</td></tr>`;
        }
    }

    // Init
    fetchData();
    if(window.appSettings) populateDropdowns();
});
