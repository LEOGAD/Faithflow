document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.settings-tab-btn');
    const container = document.getElementById('tabPanelsContainer');
    let currentTab = 'church-profile';
    
    // Listen for settings load
    window.addEventListener('settingsUpdated', () => {
        renderActiveTab();
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderActiveTab();
        });
    });
    
    // Initial Render
    if(window.appSettings) {
        renderActiveTab();
    }
    
    async function updateSettings(section, payload) {
        try {
            const btn = document.querySelector('.btn-primary');
            if(btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
            
            await apiCall(`/settings/${section}`, 'PUT', payload);
            showToast('Settings saved successfully', 'success');
            await loadGlobalSettings(); // Re-fetch and trigger settingsUpdated
        } catch (e) {
            showToast(e.message, 'error');
        }
    }



    function renderActiveTab() {
        if (!window.appSettings) return;
        container.innerHTML = '';
        
        switch(currentTab) {
            case 'church-profile': return renderChurchProfile();
            case 'services': return renderServices();
            case 'income-categories': return renderIncomeCategories();
            case 'expense-categories': return renderExpenseCategories();
            case 'attendance': return renderAttendance();
            case 'reports': return renderReports();
            case 'pdf-branding': return renderPDFBranding();
            case 'users': return renderUsers();
            case 'notifications': return renderNotifications();
            case 'financial': return renderFinancial();
            case 'system': return renderSystem();
            case 'backup': return renderBackup();
        }
    }
    
    // ==========================================
    // TAB: Church Profile
    // ==========================================
    function renderChurchProfile() {
        const data = window.appSettings.settings.church_profile || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Church Profile</h3>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Church Name</label>
                        <input type="text" id="cp-name" class="form-control" value="${data.churchName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Currency</label>
                        <select id="cp-currency" class="form-control">
                            <option value="NGN" ${data.currency === 'NGN' ? 'selected' : ''}>Nigerian Naira (₦)</option>
                            <option value="USD" ${data.currency === 'USD' ? 'selected' : ''}>US Dollar ($)</option>
                            <option value="GBP" ${data.currency === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
                            <option value="EUR" ${data.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                            <option value="KES" ${data.currency === 'KES' ? 'selected' : ''}>Kenyan Shilling (KSh)</option>
                            <option value="ZAR" ${data.currency === 'ZAR' ? 'selected' : ''}>South African Rand (R)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Church Logo Upload</label>
                    <input type="file" id="cp-logo-file" class="form-control" accept="image/*">
                    <input type="hidden" id="cp-logo" value="${data.logoUrl || ''}">
                    ${data.logoUrl ? `<img src="${data.logoUrl}" id="cp-logo-preview" style="height:60px; margin-top:10px; border-radius:4px; object-fit:contain; background: var(--bg-primary); padding: 5px;">` : `<img src="" id="cp-logo-preview" style="display:none; height:60px; margin-top:10px; border-radius:4px; object-fit:contain; background: var(--bg-primary); padding: 5px;">`}
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" id="cp-address" class="form-control" value="${data.address || ''}">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="text" id="cp-phone" class="form-control" value="${data.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="cp-email" class="form-control" value="${data.email || ''}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Website URL</label>
                        <input type="text" id="cp-website" class="form-control" value="${data.website || ''}">
                    </div>
                    <div class="form-group">
                        <label>Pastor Name</label>
                        <input type="text" id="cp-pastor" class="form-control" value="${data.pastorName || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Church Motto / Tagline</label>
                    <input type="text" id="cp-tagline" class="form-control" value="${data.tagline || ''}">
                </div>
                <div class="form-group">
                    <label>The Mandate (Used in PDF Reports)</label>
                    <textarea id="cp-mandate" class="form-control" rows="3" placeholder="Enter church mandate...">${data.mandate || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Vision & Mission Statement (Used in PDF Reports)</label>
                    <textarea id="cp-vision" class="form-control" rows="3" placeholder="Enter vision and mission...">${data.vision || ''}</textarea>
                </div>
                <button class="btn-primary" id="cp-save">Save Profile Settings</button>
            </div>
        `;
        
        document.getElementById('cp-logo-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('cp-logo-preview').src = evt.target.result;
                    document.getElementById('cp-logo-preview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById('cp-save').addEventListener('click', async () => {
            const saveBtn = document.getElementById('cp-save');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            let finalLogoUrl = document.getElementById('cp-logo').value;
            const fileInput = document.getElementById('cp-logo-file');
            
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const base64String = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                
                try {
                    const res = await apiCall('/settings/upload-logo', 'POST', { imageBase64: base64String });
                    finalLogoUrl = res.logoUrl;
                } catch (e) {
                    showToast('Failed to upload logo: ' + e.message, 'error');
                }
            }
            
            updateSettings('church_profile', {
                churchName: document.getElementById('cp-name').value,
                currency: document.getElementById('cp-currency').value,
                logoUrl: finalLogoUrl,
                address: document.getElementById('cp-address').value,
                phone: document.getElementById('cp-phone').value,
                email: document.getElementById('cp-email').value,
                website: document.getElementById('cp-website').value,
                pastorName: document.getElementById('cp-pastor').value,
                tagline: document.getElementById('cp-tagline').value,
                mandate: document.getElementById('cp-mandate').value,
                vision: document.getElementById('cp-vision').value
            });
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Profile Settings';
        });
    }

    // ==========================================
    // TAB: Services
    // ==========================================
    function renderServices() {
        const services = window.appSettings.services || [];
        
        let html = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Services Setup</h3>
                    <button class="btn-primary" id="addServiceBtn"><span class="material-symbols-outlined">add</span> Add Service</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Service Name</th>
                                <th>Type</th>
                                <th>Tracking</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        services.sort((a,b) => a.order - b.order).forEach(svc => {
            html += `
                <tr>
                    <td>${svc.order || 0}</td>
                    <td style="font-weight:600;">${svc.name}</td>
                    <td><span class="status-badge" style="background:var(--bg-secondary);color:var(--text-primary);">${svc.type}</span></td>
                    <td>
                        <div style="display:flex;gap:0.5rem;font-size:0.8rem;">
                            ${svc.trackAttendance ? '<span class="status-badge status-paid">Attendance</span>' : ''}
                            ${svc.trackFinance ? '<span class="status-badge status-paid">Finance</span>' : ''}
                        </div>
                    </td>
                    <td>${svc.active ? '<span class="status-badge status-paid">Active</span>' : '<span class="status-badge status-unpaid">Inactive</span>'}</td>
                    <td>
                        <button class="btn-icon" onclick="editService('${svc.id}')"><span class="material-symbols-outlined">edit</span></button>
                        <button class="btn-icon text-danger" onclick="deleteService('${svc.id}')"><span class="material-symbols-outlined">delete</span></button>
                    </td>
                </tr>
            `;
        });
        
        if (services.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center;padding:2rem;">No services configured</td></tr>`;
        }
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
        
        document.getElementById('addServiceBtn').addEventListener('click', () => showServiceModal());
    }

    // Assign globally to be callable from HTML onclick strings
    window.deleteService = (id) => showConfirmModal('Delete Service', 'Are you sure you want to delete this service? This cannot be undone.', () => apiDelete(`/settings/services/${id}`));
    window.editService = (id) => {
        const svc = window.appSettings.services.find(s => s.id === id);
        if(svc) showServiceModal(svc);
    };

    function showServiceModal(svc = null) {
        document.getElementById('settingsModalTitle').textContent = svc ? 'Edit Service' : 'Add Service';
        const body = document.getElementById('settingsModalBody');
        body.innerHTML = `
            <div class="form-group">
                <label>Service Name</label>
                <input type="text" id="svc-name" class="form-control" value="${svc ? svc.name : ''}" required>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Service Type</label>
                    <select id="svc-type" class="form-control">
                        <option value="Sunday" ${svc && svc.type === 'Sunday' ? 'selected' : ''}>Sunday Service</option>
                        <option value="Midweek" ${svc && svc.type === 'Midweek' ? 'selected' : ''}>Midweek Service</option>
                        <option value="Special" ${svc && svc.type === 'Special' ? 'selected' : ''}>Special Program</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Display Order</label>
                    <input type="number" id="svc-order" class="form-control" value="${svc ? svc.order : '1'}">
                </div>
            </div>
            <div class="form-group" style="display:flex; gap: 1rem; align-items:center;">
                <label style="margin:0;"><input type="checkbox" id="svc-attendance" ${!svc || svc.trackAttendance ? 'checked' : ''}> Track Attendance</label>
                <label style="margin:0;"><input type="checkbox" id="svc-finance" ${!svc || svc.trackFinance ? 'checked' : ''}> Track Finances</label>
                <label style="margin:0;"><input type="checkbox" id="svc-active" ${!svc || svc.active ? 'checked' : ''}> Active</label>
            </div>
        `;
        
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        const form = document.getElementById('settingsModalForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('svc-name').value,
                type: document.getElementById('svc-type').value,
                order: parseInt(document.getElementById('svc-order').value) || 1,
                trackAttendance: document.getElementById('svc-attendance').checked,
                trackFinance: document.getElementById('svc-finance').checked,
                active: document.getElementById('svc-active').checked
            };
            try {
                if (svc) await apiCall(`/settings/services/${svc.id}`, 'PUT', payload);
                else await apiCall(`/settings/services/create`, 'POST', payload);
                showToast('Service saved', 'success');
                modal.classList.remove('active');
                await loadGlobalSettings();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
        
        document.getElementById('settingsModalClose').onclick = () => modal.classList.remove('active');
        document.getElementById('settingsModalCancel').onclick = () => modal.classList.remove('active');
    }

    // ==========================================
    // TAB: Income Categories
    // ==========================================
    function renderIncomeCategories() {
        const categories = window.appSettings.income_categories || [];
        
        let html = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Income Categories</h3>
                    <button class="btn-primary" id="addIncCatBtn"><span class="material-symbols-outlined">add</span> Add Category</button>
                </div>
                <div class="grid-4">
        `;
        
        categories.forEach(cat => {
            html += `
                <div class="stat-card" style="position:relative; border-top: 4px solid ${cat.color || '#4f46e5'};">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="margin:0; font-size:1.1rem;">${cat.name}</h4>
                        <div>
                            <button class="btn-icon" style="padding:2px;" onclick="editIncCat('${cat.id}')"><span class="material-symbols-outlined" style="font-size:18px;">edit</span></button>
                            <button class="btn-icon text-danger" style="padding:2px;" onclick="deleteIncCat('${cat.id}')"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>
                        </div>
                    </div>
                    <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-secondary);">Status: ${cat.active ? 'Active' : 'Inactive'}</p>
                </div>
            `;
        });
        
        html += `</div></div>`;
        container.innerHTML = html;
        document.getElementById('addIncCatBtn').addEventListener('click', () => showIncCatModal());
    }

    window.deleteIncCat = (id) => showConfirmModal('Delete Category', 'Delete this income category?', () => apiDelete(`/settings/income-categories/${id}`));
    window.editIncCat = (id) => {
        const cat = window.appSettings.income_categories.find(c => c.id === id);
        if(cat) showIncCatModal(cat);
    };

    function showIncCatModal(cat = null) {
        document.getElementById('settingsModalTitle').textContent = cat ? 'Edit Income Category' : 'Add Income Category';
        const body = document.getElementById('settingsModalBody');
        body.innerHTML = `
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="inc-name" class="form-control" value="${cat ? cat.name : ''}" required>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Theme Color</label>
                    <input type="color" id="inc-color" class="form-control" style="padding:0;height:40px;" value="${cat ? (cat.color || '#4f46e5') : '#4f46e5'}">
                </div>
                <div class="form-group" style="display:flex; align-items:center; padding-top: 2rem;">
                    <label style="margin:0;"><input type="checkbox" id="inc-active" ${!cat || cat.active ? 'checked' : ''}> Active</label>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        const form = document.getElementById('settingsModalForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('inc-name').value,
                color: document.getElementById('inc-color').value,
                active: document.getElementById('inc-active').checked
            };
            try {
                if (cat) await apiCall(`/settings/income-categories/${cat.id}`, 'PUT', payload);
                else await apiCall(`/settings/income-categories/create`, 'POST', payload);
                showToast('Category saved', 'success');
                modal.classList.remove('active');
                await loadGlobalSettings();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ==========================================
    // TAB: Expense Categories
    // ==========================================
    function renderExpenseCategories() {
        const categories = window.appSettings.expense_categories || [];
        
        let html = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Expense Categories</h3>
                    <button class="btn-primary" id="addExpCatBtn"><span class="material-symbols-outlined">add</span> Add Category</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Color</th>
                                <th>Monthly Budget Limit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        categories.forEach(cat => {
            html += `
                <tr>
                    <td style="font-weight:600;">${cat.name}</td>
                    <td><div style="width:24px;height:24px;border-radius:50%;background:${cat.color||'#000'}; border:2px solid var(--border-color);"></div></td>
                    <td>${cat.budgetLimit ? formatCurrency(cat.budgetLimit) : '<span style="color:var(--text-secondary)">No limit</span>'}</td>
                    <td>${cat.active ? '<span class="status-badge status-paid">Active</span>' : '<span class="status-badge status-unpaid">Inactive</span>'}</td>
                    <td>
                        <button class="btn-icon" onclick="editExpCat('${cat.id}')"><span class="material-symbols-outlined">edit</span></button>
                        <button class="btn-icon text-danger" onclick="deleteExpCat('${cat.id}')"><span class="material-symbols-outlined">delete</span></button>
                    </td>
                </tr>
            `;
        });
        
        if (categories.length === 0) html += `<tr><td colspan="5" style="text-align:center;padding:2rem;">No categories</td></tr>`;
        
        html += `</tbody></table></div></div>`;
        container.innerHTML = html;
        document.getElementById('addExpCatBtn').addEventListener('click', () => showExpCatModal());
    }

    window.deleteExpCat = (id) => showConfirmModal('Delete Category', 'Delete this expense category?', () => apiDelete(`/settings/expense-categories/${id}`));
    window.editExpCat = (id) => {
        const cat = window.appSettings.expense_categories.find(c => c.id === id);
        if(cat) showExpCatModal(cat);
    };

    function showExpCatModal(cat = null) {
        document.getElementById('settingsModalTitle').textContent = cat ? 'Edit Expense Category' : 'Add Expense Category';
        const body = document.getElementById('settingsModalBody');
        body.innerHTML = `
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="exp-name" class="form-control" value="${cat ? cat.name : ''}" required>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Theme Color</label>
                    <input type="color" id="exp-color" class="form-control" style="padding:0;height:40px;" value="${cat ? (cat.color || '#ef4444') : '#ef4444'}">
                </div>
                <div class="form-group">
                    <label>Monthly Budget Limit (Optional)</label>
                    <input type="number" id="exp-budget" class="form-control" value="${cat && cat.budgetLimit ? cat.budgetLimit : ''}" placeholder="E.g. 50000">
                </div>
            </div>
            <div class="form-group" style="display:flex; align-items:center;">
                <label style="margin:0;"><input type="checkbox" id="exp-active" ${!cat || cat.active ? 'checked' : ''}> Active</label>
            </div>
        `;
        
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        const form = document.getElementById('settingsModalForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('exp-name').value,
                color: document.getElementById('exp-color').value,
                budgetLimit: document.getElementById('exp-budget').value ? Number(document.getElementById('exp-budget').value) : null,
                active: document.getElementById('exp-active').checked
            };
            try {
                if (cat) await apiCall(`/settings/expense-categories/${cat.id}`, 'PUT', payload);
                else await apiCall(`/settings/expense-categories/create`, 'POST', payload);
                showToast('Category saved', 'success');
                modal.classList.remove('active');
                await loadGlobalSettings();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ==========================================
    // TAB: Attendance Settings
    // ==========================================
    function renderAttendance() {
        const data = window.appSettings.settings.attendance || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Attendance Settings</h3>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem; font-weight:600;">
                        <input type="checkbox" id="att-enable" ${data.enableTracking ? 'checked' : ''} style="width:20px;height:20px;"> 
                        Enable Attendance Tracking System
                    </label>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Attendance Grouping</label>
                        <select id="att-grouping" class="form-control">
                            <option value="Per Service" ${data.grouping === 'Per Service' ? 'selected' : ''}>Per Service (Individual)</option>
                            <option value="Daily" ${data.grouping === 'Daily' ? 'selected' : ''}>Daily Totals</option>
                            <option value="Weekly" ${data.grouping === 'Weekly' ? 'selected' : ''}>Weekly Totals</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Attendance Warning Threshold</label>
                        <input type="number" id="att-threshold" class="form-control" value="${data.warningThreshold || 50}">
                        <small style="color:var(--text-secondary)">Triggers dashboard alert if attendance drops below this number</small>
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="att-weekly" ${data.autoWeeklyTotals ? 'checked' : ''}> Auto Calculate Weekly Totals
                    </label>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="att-reports" ${data.includeInReports ? 'checked' : ''}> Include Attendance in Master Reports
                    </label>
                </div>
                <button class="btn-primary" id="att-save">Save Settings</button>
            </div>
        `;
        document.getElementById('att-save').addEventListener('click', () => {
            updateSettings('attendance', {
                enableTracking: document.getElementById('att-enable').checked,
                grouping: document.getElementById('att-grouping').value,
                warningThreshold: Number(document.getElementById('att-threshold').value),
                autoWeeklyTotals: document.getElementById('att-weekly').checked,
                includeInReports: document.getElementById('att-reports').checked
            });
        });
    }

    // ==========================================
    // TAB: Report Settings
    // ==========================================
    function renderReports() {
        const data = window.appSettings.settings.reports || { weekly: {}, monthly: {} };
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Report Settings</h3>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Week Starts On</label>
                        <select id="rep-weekstart" class="form-control">
                            <option value="Sunday" ${data.weekStartsOn === 'Sunday' ? 'selected' : ''}>Sunday</option>
                            <option value="Monday" ${data.weekStartsOn === 'Monday' ? 'selected' : ''}>Monday</option>
                        </select>
                    </div>
                    <div class="form-group" style="padding-top:2rem;">
                        <label style="display:flex; align-items:center; gap:0.5rem; font-weight:600;">
                            <input type="checkbox" id="rep-auto" ${data.autoGenerate ? 'checked' : ''}> Auto Generate Reports
                        </label>
                    </div>
                </div>
                
                <div class="grid-2" style="margin-top:2rem;">
                    <div class="stat-card" style="box-shadow:none; border:1px solid var(--border-color);">
                        <h4>Weekly Report Includes</h4>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-w-inc" ${data.weekly.income ? 'checked' : ''}> Income Breakdown</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-w-exp" ${data.weekly.expenses ? 'checked' : ''}> Expense Breakdown</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-w-att" ${data.weekly.attendance ? 'checked' : ''}> Attendance Summary</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-w-svc" ${data.weekly.perService ? 'checked' : ''}> Per Service Details</label>
                    </div>
                    <div class="stat-card" style="box-shadow:none; border:1px solid var(--border-color);">
                        <h4>Monthly Report Includes</h4>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-m-sum" ${data.monthly.summary ? 'checked' : ''}> Monthly Summary</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-m-tithe" ${data.monthly.tithe ? 'checked' : ''}> Tithe Calculation</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-m-cat" ${data.monthly.categories ? 'checked' : ''}> Category Breakdown</label>
                        <label style="display:block; margin:1rem 0;"><input type="checkbox" id="rep-m-att" ${data.monthly.attendance ? 'checked' : ''}> Attendance Analysis</label>
                    </div>
                </div>
                <button class="btn-primary" style="margin-top:1.5rem;" id="rep-save">Save Settings</button>
            </div>
        `;
        document.getElementById('rep-save').addEventListener('click', () => {
            updateSettings('reports', {
                weekStartsOn: document.getElementById('rep-weekstart').value,
                autoGenerate: document.getElementById('rep-auto').checked,
                weekly: {
                    income: document.getElementById('rep-w-inc').checked,
                    expenses: document.getElementById('rep-w-exp').checked,
                    attendance: document.getElementById('rep-w-att').checked,
                    perService: document.getElementById('rep-w-svc').checked
                },
                monthly: {
                    summary: document.getElementById('rep-m-sum').checked,
                    tithe: document.getElementById('rep-m-tithe').checked,
                    categories: document.getElementById('rep-m-cat').checked,
                    attendance: document.getElementById('rep-m-att').checked
                }
            });
        });
    }

    // ==========================================
    // TAB: PDF Branding
    // ==========================================
    function renderPDFBranding() {
        const data = window.appSettings.settings.pdf_branding || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>PDF Branding</h3>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Primary Brand Color</label>
                        <input type="color" id="pdf-color" class="form-control" style="padding:0;height:40px;" value="${data.primaryColor || '#4f46e5'}">
                    </div>
                    <div class="form-group">
                        <label>Footer Text</label>
                        <input type="text" id="pdf-footer" class="form-control" value="${data.footerText || ''}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Page Size</label>
                        <select id="pdf-size" class="form-control">
                            <option value="A4" ${data.pageSize === 'A4' ? 'selected' : ''}>A4</option>
                            <option value="Letter" ${data.pageSize === 'Letter' ? 'selected' : ''}>Letter</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Orientation</label>
                        <select id="pdf-orient" class="form-control">
                            <option value="Portrait" ${data.orientation === 'Portrait' ? 'selected' : ''}>Portrait</option>
                            <option value="Landscape" ${data.orientation === 'Landscape' ? 'selected' : ''}>Landscape</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="pdf-treasurer" ${data.includeTreasurerSignature ? 'checked' : ''}> Include Treasurer Signature Line
                    </label>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="pdf-pastor" ${data.includePastorSignature ? 'checked' : ''}> Include Pastor Signature Line
                    </label>
                </div>
                <button class="btn-primary" id="pdf-save">Save PDF Branding</button>
            </div>
        `;
        document.getElementById('pdf-save').addEventListener('click', () => {
            updateSettings('pdf_branding', {
                primaryColor: document.getElementById('pdf-color').value,
                footerText: document.getElementById('pdf-footer').value,
                pageSize: document.getElementById('pdf-size').value,
                orientation: document.getElementById('pdf-orient').value,
                includeTreasurerSignature: document.getElementById('pdf-treasurer').checked,
                includePastorSignature: document.getElementById('pdf-pastor').checked
            });
        });
    }

    // ==========================================
    // TAB: Financial Settings
    // ==========================================
    function renderFinancial() {
        const data = window.appSettings.settings.financial || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Financial Settings</h3>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Standard Tithe Percentage (%)</label>
                        <input type="number" id="fin-tithe" class="form-control" value="${data.tithePercentage || 10}">
                    </div>
                    <div class="form-group">
                        <label>Decimal Precision</label>
                        <select id="fin-precision" class="form-control">
                            <option value="0" ${data.decimalPrecision === 0 ? 'selected' : ''}>0 (e.g. 50,000)</option>
                            <option value="2" ${data.decimalPrecision === 2 ? 'selected' : ''}>2 (e.g. 50,000.00)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="fin-cards" ${data.enableSummaryCards ? 'checked' : ''}> Enable Financial Summary Cards on Dashboard
                    </label>
                </div>
                <button class="btn-primary" id="fin-save">Save Financial Settings</button>
            </div>
        `;
        document.getElementById('fin-save').addEventListener('click', () => {
            updateSettings('financial', {
                tithePercentage: Number(document.getElementById('fin-tithe').value),
                decimalPrecision: Number(document.getElementById('fin-precision').value),
                enableSummaryCards: document.getElementById('fin-cards').checked
            });
        });
    }

    // ==========================================
    // TAB: System Preferences
    // ==========================================
    function renderSystem() {
        const data = window.appSettings.settings.system || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>System Preferences</h3>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Theme</label>
                        <select id="sys-theme" class="form-control">
                            <option value="Light" ${data.theme === 'Light' ? 'selected' : ''}>Light Mode</option>
                            <option value="Dark" ${data.theme === 'Dark' ? 'selected' : ''}>Dark Mode</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date Format</label>
                        <select id="sys-date" class="form-control">
                            <option value="DD/MM/YYYY" ${data.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY" ${data.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD" ${data.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Default Table Pagination Size</label>
                    <select id="sys-page" class="form-control" style="width:200px;">
                        <option value="10" ${data.paginationSize === 10 ? 'selected' : ''}>10 Rows</option>
                        <option value="25" ${data.paginationSize === 25 ? 'selected' : ''}>25 Rows</option>
                        <option value="50" ${data.paginationSize === 50 ? 'selected' : ''}>50 Rows</option>
                        <option value="100" ${data.paginationSize === 100 ? 'selected' : ''}>100 Rows</option>
                    </select>
                </div>
                <button class="btn-primary" id="sys-save">Save Preferences</button>
            </div>
        `;
        document.getElementById('sys-save').addEventListener('click', () => {
            updateSettings('system', {
                theme: document.getElementById('sys-theme').value,
                dateFormat: document.getElementById('sys-date').value,
                paginationSize: Number(document.getElementById('sys-page').value)
            });
        });
    }

    // ==========================================
    // TAB: Notifications, Users, Backup
    // ==========================================
    function renderNotifications() {
        const data = window.appSettings.settings.notifications || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Notification Settings</h3>
                <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Configure automated email alerts and system reminders.</p>
                <div class="form-group"><label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="not-w-email" ${data.weeklyReportEmail ? 'checked' : ''}> Send Weekly Report Emails to Admins</label></div>
                <div class="form-group"><label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="not-m-email" ${data.monthlyReportEmail ? 'checked' : ''}> Send Monthly Report Emails to Admins</label></div>
                <div class="form-group"><label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="not-att" ${data.noAttendanceReminder ? 'checked' : ''}> Reminder: No attendance added for an active service</label></div>
                <div class="form-group"><label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="not-exp" ${data.noExpensesReminder ? 'checked' : ''}> Reminder: No expenses recorded this week</label></div>
                <div class="form-group"><label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="not-ready" ${data.reportReadyNotification ? 'checked' : ''}> Notify when auto-generated report is ready</label></div>
                <button class="btn-primary" id="not-save">Save Notifications</button>
            </div>
        `;
        document.getElementById('not-save').addEventListener('click', () => {
            updateSettings('notifications', {
                weeklyReportEmail: document.getElementById('not-w-email').checked,
                monthlyReportEmail: document.getElementById('not-m-email').checked,
                noAttendanceReminder: document.getElementById('not-att').checked,
                noExpensesReminder: document.getElementById('not-exp').checked,
                reportReadyNotification: document.getElementById('not-ready').checked
            });
        });
    }

    function renderUsers() {
        container.innerHTML = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>User Management</h3>
                    <button class="btn-primary" id="addUserBtn"><span class="material-symbols-outlined">person_add</span> Add User</button>
                </div>
                <p style="color:var(--text-secondary);margin-bottom:1.5rem;">Manage role-based access control for your Church workspace.</p>
                <div class="table-container">
                    <table class="data-table" id="usersTable">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody><tr><td colspan="5" style="text-align:center;">Loading users...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;
        
        function loadUsersTable() {
            apiCall('/settings/users/list').then(users => {
                const tbody = document.querySelector('#usersTable tbody');
                if(!users.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users found</td></tr>'; return; }
                tbody.innerHTML = users.map(u => `
                    <tr>
                        <td>${u.name || 'Unknown'}</td>
                        <td>${u.email || ''}</td>
                        <td><span class="status-badge" style="background:var(--primary);color:white;">${u.role || 'User'}</span></td>
                        <td><span class="status-badge status-paid">Active</span></td>
                        <td><button class="btn-icon text-danger" onclick="apiDelete('/settings/users/${u.id}')"><span class="material-symbols-outlined">delete</span></button></td>
                    </tr>
                `).join('');
            }).catch(err => {
                document.querySelector('#usersTable tbody').innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error loading users</td></tr>`;
            });
        }
        
        loadUsersTable();
        
        document.getElementById('addUserBtn').addEventListener('click', () => {
            const modalBody = document.getElementById('settingsModalBody');
            document.getElementById('settingsModalTitle').textContent = 'Add New User';
            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="nu-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="nu-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="nu-password" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="nu-role" class="form-control">
                        <option value="owner">Owner (Full Admin)</option>
                        <option value="treasurer">Treasurer (Finance Only)</option>
                        <option value="attendance_admin">Attendance Admin</option>
                        <option value="viewer">Viewer (Read-Only)</option>
                    </select>
                </div>
            `;
            const modal = document.getElementById('settingsModal');
            modal.classList.add('active');
            
            const form = document.getElementById('settingsModalForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const payload = {
                    name: document.getElementById('nu-name').value,
                    email: document.getElementById('nu-email').value,
                    password: document.getElementById('nu-password').value,
                    role: document.getElementById('nu-role').value
                };
                try {
                    await apiCall('/settings/users/create', 'POST', payload);
                    showToast('User created successfully', 'success');
                    modal.classList.remove('active');
                    loadUsersTable();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            };
        });
    }

    function renderBackup() {
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Backup & Export Center</h3>
                <p style="color:var(--text-secondary);margin-bottom:2rem;">Export your data for external analysis or create full system backups.</p>
                
                <div class="grid-3" style="margin-bottom:3rem;">
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--primary);margin-bottom:1rem;">payments</span>
                        <h4>Income Data</h4>
                        <button class="btn-secondary" style="width:100%;margin-top:1rem;" onclick="window.open('http://localhost:5000/export/income', '_blank')">Export CSV</button>
                    </div>
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--danger);margin-bottom:1rem;">receipt_long</span>
                        <h4>Expense Data</h4>
                        <button class="btn-secondary" style="width:100%;margin-top:1rem;" onclick="window.open('http://localhost:5000/export/expenses', '_blank')">Export CSV</button>
                    </div>
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:3rem;color:var(--success);margin-bottom:1rem;">groups</span>
                        <h4>Attendance Data</h4>
                        <button class="btn-secondary" style="width:100%;margin-top:1rem;" onclick="window.open('http://localhost:5000/export/attendance', '_blank')">Export CSV</button>
                    </div>
                </div>

                <div style="border-top:1px solid var(--border-color); padding-top:2rem;">
                    <h4>System Backup</h4>
                    <p style="color:var(--text-secondary);margin-bottom:1rem;">Download a full JSON backup of all your settings, members, and transactions.</p>
                    <button class="btn-primary" onclick="window.open('http://localhost:5000/backup/download', '_blank')"><span class="material-symbols-outlined">download</span> Download Full Backup</button>
                    
                    <h4 style="margin-top:2rem;">Restore Backup</h4>
                    <input type="file" id="backupFile" accept=".json" class="form-control" style="margin-bottom:1rem; max-width:400px;">
                    <button class="btn-secondary" onclick="showToast('Restore disabled pending full firestore migration','info')"><span class="material-symbols-outlined">upload</span> Restore from Backup</button>
                </div>
            </div>
        `;
    }
});
