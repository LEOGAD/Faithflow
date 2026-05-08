const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.settings-tab-btn');
    const container = document.getElementById('tabPanelsContainer');
    let currentTab = 'church-profile';
    
    console.log('Settings Module Initialized');

    // Listen for settings load
    window.addEventListener('settingsUpdated', (e) => {
        console.log('Settings Data Received:', e.detail);
        window.appSettings = e.detail;
        renderActiveTab();
    });
    
    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Switching to tab:', tab.dataset.tab);
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderActiveTab();
        });
    });
    
    // Initial Render check
    if(window.appSettings) {
        renderActiveTab();
    } else {
        // Show loading state if data hasn't arrived yet
        if(container) {
            container.innerHTML = `
                <div class="settings-section fade-in" style="text-align:center; padding: 5rem 2rem;">
                    <div class="loader-spinner" style="margin: 0 auto 1.5rem auto; width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <h3>Loading Church Settings...</h3>
                    <p style="color:var(--text-secondary); margin-top: 0.5rem;">Fetching your workspace configuration from the server.</p>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            `;
        }
    }
    
    async function updateSettings(section, payload) {
        try {
            const btn = document.querySelector('.btn-primary');
            const originalText = btn ? btn.textContent : 'Save';
            if(btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
            
            await apiCall(`/settings/${section}`, 'PUT', payload);
            showToast('Settings saved successfully', 'success');
            
            // Re-load settings to ensure UI is in sync
            if (typeof loadGlobalSettings === 'function') {
                await loadGlobalSettings();
            }
        } catch (e) {
            showToast('Save Failed: ' + e.message, 'error');
            const btn = document.querySelector('.btn-primary');
            if(btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
        }
    }

    function renderActiveTab() {
        if (!window.appSettings) return;
        if (!container) return;
        
        try {
            container.innerHTML = '';
            console.log('Rendering Panel:', currentTab);
            
            switch(currentTab) {
                case 'church-profile': renderChurchProfile(); break;
                case 'services': renderServices(); break;
                case 'income-categories': renderIncomeCategories(); break;
                case 'expense-categories': renderExpenseCategories(); break;
                case 'attendance': renderAttendance(); break;
                case 'reports': renderReports(); break;
                case 'pdf-branding': renderPDFBranding(); break;
                case 'users': renderUsers(); break;
                case 'notifications': renderNotifications(); break;
                case 'financial': renderFinancial(); break;
                case 'system': renderSystem(); break;
                case 'backup': renderBackup(); break;
                default: 
                    container.innerHTML = `<h3>Tab ${currentTab} coming soon</h3>`;
            }
        } catch (err) {
            console.error('Rendering Failure:', err);
            container.innerHTML = `
                <div class="settings-section fade-in" style="text-align:center; padding: 3rem; border: 1px dashed var(--danger); border-radius: 12px;">
                    <span class="material-symbols-outlined" style="font-size:3.5rem; color:var(--danger); margin-bottom:1rem;">report_problem</span>
                    <h3 style="color:var(--danger);">Display Error</h3>
                    <p style="color:var(--text-secondary); margin-bottom: 1.5rem;">The ${currentTab} panel failed to draw. This is usually due to missing database fields.</p>
                    <code style="display:block; background: #fef2f2; padding: 1rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1.5rem;">${err.message}</code>
                    <button class="btn-primary" onclick="location.reload()">Reload Dashboard</button>
                </div>
            `;
        }
    }

    // --- TAB RENDERING FUNCTIONS ---

    function renderChurchProfile() {
        const data = window.appSettings.settings.church_profile || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Church Profile</h3>
                <div class="profile-header-settings" style="display:flex; align-items:center; gap:2rem; margin-bottom:2rem; padding:1.5rem; background:var(--bg-light); border-radius:12px;">
                    <div class="logo-preview-container" style="position:relative; width:100px; height:100px; border-radius:50%; overflow:hidden; border:2px dashed var(--border-color); background:white; display:flex; align-items:center; justify-content:center;">
                        <img id="logoPreview" src="${data.logoUrl || 'https://via.placeholder.com/100?text=Logo'}" style="width:100%; height:100%; object-fit:contain;">
                        <label for="logoUpload" style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:10px; text-align:center; padding:4px; cursor:pointer;">CHANGE</label>
                        <input type="file" id="logoUpload" hidden accept="image/*">
                    </div>
                    <div>
                        <h4 style="margin-bottom:0.5rem;">Church Brand Logo</h4>
                        <p style="font-size:0.85rem; color:var(--text-secondary);">This logo will appear on your dashboard, sidebars, and all generated PDF reports. (PNG or JPG, max 2MB)</p>
                    </div>
                </div>
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
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Church Motto / Tagline</label>
                    <input type="text" id="cp-tagline" class="form-control" value="${data.tagline || ''}">
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
                <div class="form-group">
                    <label>Physical Address</label>
                    <textarea id="cp-address" class="form-control" rows="2">${data.address || ''}</textarea>
                </div>
                <button class="btn-primary" id="cp-save">Save Profile Settings</button>
            </div>
        `;
        
        // Handle Logo Upload
        document.getElementById('logoUpload').addEventListener('change', window.handleLogoUpload);

        document.getElementById('cp-save').addEventListener('click', () => {
            updateSettings('church_profile', {
                churchName: document.getElementById('cp-name').value,
                currency: document.getElementById('cp-currency').value,
                tagline: document.getElementById('cp-tagline').value,
                phone: document.getElementById('cp-phone').value,
                email: document.getElementById('cp-email').value,
                address: document.getElementById('cp-address').value,
                logoUrl: document.getElementById('logoPreview').src
            });
        });
    }

    function renderServices() {
        const services = window.appSettings.services || [];
        container.innerHTML = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Church Services</h3>
                    <button class="btn-primary" id="addSvcBtn"><span class="material-symbols-outlined">add</span> Add Service</button>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Name</th><th>Type</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${services.map(s => `
                                <tr>
                                    <td><strong>${s.name}</strong></td>
                                    <td>${s.type}</td>
                                    <td>${s.order}</td>
                                    <td><span class="status-badge ${s.active ? 'status-paid' : 'status-pending'}">${s.active ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <button class="btn-icon text-danger" onclick="apiDelete('/settings/services/${s.id}')"><span class="material-symbols-outlined">delete</span></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.getElementById('addSvcBtn').addEventListener('click', () => {
            const modalBody = document.getElementById('settingsModalBody');
            document.getElementById('settingsModalTitle').textContent = 'Add New Service';
            modalBody.innerHTML = `
                <div class="form-group"><label>Service Name</label><input type="text" id="svc-name" class="form-control" required placeholder="e.g. Sunday 1st Service"></div>
                <div class="form-group"><label>Service Type</label><select id="svc-type" class="form-control"><option>Sunday</option><option>Midweek</option><option>Special</option></select></div>
                <div class="form-group"><label>Display Order</label><input type="number" id="svc-order" class="form-control" value="1"></div>
                <div class="form-group" style="display:flex; gap:1.5rem; margin-top:1rem;">
                    <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="svc-fin" checked> Track Finance</label>
                    <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="svc-att" checked> Track Attendance</label>
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
                    order: Number(document.getElementById('svc-order').value),
                    trackFinance: document.getElementById('svc-fin').checked,
                    trackAttendance: document.getElementById('svc-att').checked
                };
                try {
                    await apiCall('/settings/services', 'POST', payload);
                    showToast('Service added', 'success');
                    modal.classList.remove('active');
                    if(typeof loadGlobalSettings === 'function') await loadGlobalSettings();
                } catch(err) { showToast(err.message, 'error'); }
            };
        });
    }

    function renderIncomeCategories() {
        const cats = window.appSettings.income_categories || [];
        container.innerHTML = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Income Categories</h3>
                    <button class="btn-primary" id="addIcBtn"><span class="material-symbols-outlined">add</span> Add Category</button>
                </div>
                <div class="grid-3">
                    ${cats.map(c => `
                        <div class="stat-card" style="border-left: 4px solid ${c.color || 'var(--primary)'};">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4 style="margin:0;">${c.name}</h4>
                                <button class="btn-icon text-danger" onclick="apiDelete('/settings/income-categories/${c.id}')"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.getElementById('addIcBtn').addEventListener('click', () => {
            const modalBody = document.getElementById('settingsModalBody');
            document.getElementById('settingsModalTitle').textContent = 'Add Income Category';
            modalBody.innerHTML = `
                <div class="form-group"><label>Category Name</label><input type="text" id="cat-name" class="form-control" required></div>
                <div class="form-group"><label>Display Color</label><input type="color" id="cat-color" class="form-control" style="height:45px;padding:2px;" value="#4f46e5"></div>
            `;
            const modal = document.getElementById('settingsModal');
            modal.classList.add('active');
            
            const form = document.getElementById('settingsModalForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const payload = { name: document.getElementById('cat-name').value, color: document.getElementById('cat-color').value };
                try {
                    await apiCall('/settings/income-categories', 'POST', payload);
                    showToast('Category added', 'success');
                    modal.classList.remove('active');
                    if(typeof loadGlobalSettings === 'function') await loadGlobalSettings();
                } catch(err) { showToast(err.message, 'error'); }
            };
        });
    }

    function renderExpenseCategories() {
        const cats = window.appSettings.expense_categories || [];
        container.innerHTML = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Expense Categories</h3>
                    <button class="btn-primary" id="addEcBtn"><span class="material-symbols-outlined">add</span> Add Category</button>
                </div>
                <div class="grid-3">
                    ${cats.map(c => `
                        <div class="stat-card" style="border-left: 4px solid ${c.color || 'var(--danger)'};">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4 style="margin:0;">${c.name}</h4>
                                <button class="btn-icon text-danger" onclick="apiDelete('/settings/expense-categories/${c.id}')"><span class="material-symbols-outlined">delete</span></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.getElementById('addEcBtn').addEventListener('click', () => {
            const modalBody = document.getElementById('settingsModalBody');
            document.getElementById('settingsModalTitle').textContent = 'Add Expense Category';
            modalBody.innerHTML = `
                <div class="form-group"><label>Category Name</label><input type="text" id="ec-name" class="form-control" required></div>
                <div class="form-group"><label>Display Color</label><input type="color" id="ec-color" class="form-control" style="height:45px;padding:2px;" value="#ef4444"></div>
            `;
            const modal = document.getElementById('settingsModal');
            modal.classList.add('active');
            
            const form = document.getElementById('settingsModalForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const payload = { name: document.getElementById('ec-name').value, color: document.getElementById('ec-color').value };
                try {
                    await apiCall('/settings/expense-categories', 'POST', payload);
                    showToast('Category added', 'success');
                    modal.classList.remove('active');
                    if(typeof loadGlobalSettings === 'function') await loadGlobalSettings();
                } catch(err) { showToast(err.message, 'error'); }
            };
        });
    }

    function renderAttendance() {
        const data = window.appSettings.settings.attendance || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Attendance Tracking</h3>
                <div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem;"><input type="checkbox" id="att-enable" ${data.enableTracking ? 'checked' : ''}> Enable Attendance Module</label></div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Tracking Grouping</label>
                        <select id="att-grouping" class="form-control"><option ${data.grouping==='Per Service'?'selected':''}>Per Service</option><option ${data.grouping==='Daily'?'selected':''}>Daily</option></select>
                    </div>
                    <div class="form-group">
                        <label>Growth Warning Threshold</label>
                        <input type="number" id="att-warn" class="form-control" value="${data.warningThreshold || 50}">
                    </div>
                </div>
                <button class="btn-primary" id="att-save">Save Attendance Rules</button>
            </div>
        `;
        document.getElementById('att-save').addEventListener('click', () => {
            updateSettings('attendance', {
                enableTracking: document.getElementById('att-enable').checked,
                grouping: document.getElementById('att-grouping').value,
                warningThreshold: Number(document.getElementById('att-warn').value)
            });
        });
    }

    function renderReports() {
        const data = window.appSettings.settings.reports || { weekly: {}, monthly: {} };
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Report Preferences</h3>
                <div class="grid-2">
                    <div class="form-group"><label>Week Starts On</label><select id="rep-start" class="form-control"><option ${data.weekStartsOn==='Sunday'?'selected':''}>Sunday</option><option ${data.weekStartsOn==='Monday'?'selected':''}>Monday</option></select></div>
                    <div class="form-group" style="padding-top:2rem;"><label style="display:flex;align-items:center;gap:0.5rem;"><input type="checkbox" id="rep-auto" ${data.autoGenerate ? 'checked' : ''}> Auto-Generate Weekly Reports</label></div>
                </div>
                <button class="btn-primary" id="rep-save">Save Report Rules</button>
            </div>
        `;
        document.getElementById('rep-save').addEventListener('click', () => {
            updateSettings('reports', {
                weekStartsOn: document.getElementById('rep-start').value,
                autoGenerate: document.getElementById('rep-auto').checked,
                weekly: data.weekly,
                monthly: data.monthly
            });
        });
    }

    function renderPDFBranding() {
        const data = window.appSettings.settings.pdf_branding || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>PDF Branding & Reporting</h3>
                <p style="color:var(--text-secondary); margin-bottom: 1.5rem;">Configure how your church brand appears on official documents.</p>
                
                <div class="grid-2">
                    <div class="form-group"><label>Brand Primary Color</label><input type="color" id="pdf-color" class="form-control" value="${data.primaryColor || '#4f46e5'}" style="height:45px;padding:2px;"></div>
                    <div class="form-group"><label>Report Footer Text</label><input type="text" id="pdf-footer" class="form-control" value="${data.footerText || ''}" placeholder="e.g. Committed to Faith"></div>
                </div>

                <div class="form-group">
                    <label>MANDATE OF THE CHURCH</label>
                    <textarea id="pdf-mandate" class="form-control" rows="3" placeholder="Enter the core mandate...">${data.mandate || ''}</textarea>
                </div>

                <div class="form-group">
                    <label>VISION OF THE CHURCH</label>
                    <textarea id="pdf-vision" class="form-control" rows="3" placeholder="Enter the church vision...">${data.vision || ''}</textarea>
                </div>

                <button class="btn-primary" id="pdf-save">Save Branding Preferences</button>
            </div>
        `;
        document.getElementById('pdf-save').addEventListener('click', () => {
            updateSettings('pdf_branding', {
                primaryColor: document.getElementById('pdf-color').value,
                footerText: document.getElementById('pdf-footer').value,
                mandate: document.getElementById('pdf-mandate').value,
                vision: document.getElementById('pdf-vision').value
            });
        });
    }

    function renderUsers() {
        container.innerHTML = `
            <div class="settings-section fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3>Team Management</h3>
                    <button class="btn-primary" id="addUserBtn"><span class="material-symbols-outlined">person_add</span> Invite User</button>
                </div>
                <div id="usersList">Loading users...</div>
            </div>
        `;
        
        const fetchUsers = () => {
            apiCall('/settings/users/list').then(users => {
                const list = document.getElementById('usersList');
                if(!users || !users.length) { list.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-secondary);">No other users found.</div>'; return; }
                list.innerHTML = `
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td><strong>${u.name}</strong></td>
                                        <td>${u.email}</td>
                                        <td><span class="status-badge status-paid">${u.role}</span></td>
                                        <td>
                                            <button class="btn-icon text-danger" onclick="apiDelete('/settings/users/${u.id}')"><span class="material-symbols-outlined">delete</span></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }).catch(err => { document.getElementById('usersList').innerHTML = 'Error loading users.'; });
        };
        fetchUsers();

        document.getElementById('addUserBtn').addEventListener('click', () => {
            const modalBody = document.getElementById('settingsModalBody');
            document.getElementById('settingsModalTitle').textContent = 'Invite Team Member';
            modalBody.innerHTML = `
                <div class="form-group"><label>Full Name</label><input type="text" id="u-name" class="form-control" required></div>
                <div class="form-group"><label>Email Address</label><input type="email" id="u-email" class="form-control" required></div>
                <div class="form-group"><label>Password</label><input type="password" id="u-pass" class="form-control" required placeholder="Initial password"></div>
                <div class="form-group">
                    <label>Assigned Role</label>
                    <select id="u-role" class="form-control">
                        <option value="user">User (View Only)</option>
                        <option value="admin">Admin (Manage Data)</option>
                        <option value="owner">Owner (Full Control)</option>
                    </select>
                </div>
            `;
            const modal = document.getElementById('settingsModal');
            modal.classList.add('active');
            
            const form = document.getElementById('settingsModalForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const payload = {
                    name: document.getElementById('u-name').value,
                    email: document.getElementById('u-email').value,
                    password: document.getElementById('u-pass').value,
                    role: document.getElementById('u-role').value
                };
                try {
                    await apiCall('/settings/users/create', 'POST', payload);
                    showToast('User invited successfully', 'success');
                    modal.classList.remove('active');
                    fetchUsers();
                } catch(err) { showToast(err.message, 'error'); }
            };
        });
    }

    // --- HELPER: IMAGE OPTIMIZER ---
    function optimizeImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    // --- HELPER: Update Logo Upload logic in renderChurchProfile ---
    // (This part is updated inside the renderChurchProfile function which we'll call next)
    
    // Inject the optimizer into the logo upload listener
    window.handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            showToast('Optimizing logo...', 'info');
            const optimizedBase64 = await optimizeImage(file, 400, 400, 0.7);
            document.getElementById('logoPreview').src = optimizedBase64;
            
            await apiCall('/settings/upload-logo', 'POST', { imageBase64: optimizedBase64 });
            showToast('Logo updated and optimized!', 'success');
            if (typeof loadGlobalSettings === 'function') await loadGlobalSettings();
        } catch (err) {
            showToast('Logo optimization failed: ' + err.message, 'error');
        }
    };

    function renderNotifications() {
        const data = window.appSettings.settings.notifications || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Notifications</h3>
                <div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem;"><input type="checkbox" id="not-w" ${data.weeklyReportEmail ? 'checked' : ''}> Email Weekly Reports</label></div>
                <div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem;"><input type="checkbox" id="not-rem" ${data.noAttendanceReminder ? 'checked' : ''}> Send Reminders for Missing Data</label></div>
                <button class="btn-primary" id="not-save">Save Notifications</button>
            </div>
        `;
        document.getElementById('not-save').addEventListener('click', () => {
            updateSettings('notifications', {
                weeklyReportEmail: document.getElementById('not-w').checked,
                noAttendanceReminder: document.getElementById('not-rem').checked
            });
        });
    }

    function renderFinancial() {
        const data = window.appSettings.settings.financial || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Financial Rules</h3>
                <div class="grid-2">
                    <div class="form-group"><label>Default Tithe %</label><input type="number" id="fin-tithe" class="form-control" value="${data.tithePercentage || 10}"></div>
                    <div class="form-group"><label>Decimal Places</label><select id="fin-dec" class="form-control"><option value="0" ${data.decimalPrecision===0?'selected':''}>0</option><option value="2" ${data.decimalPrecision===2?'selected':''}>2</option></select></div>
                </div>
                <button class="btn-primary" id="fin-save">Save Finance Rules</button>
            </div>
        `;
        document.getElementById('fin-save').addEventListener('click', () => {
            updateSettings('financial', {
                tithePercentage: Number(document.getElementById('fin-tithe').value),
                decimalPrecision: Number(document.getElementById('fin-dec').value)
            });
        });
    }

    function renderSystem() {
        const data = window.appSettings.settings.system || {};
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>System Preferences</h3>
                <div class="grid-2">
                    <div class="form-group"><label>Portal Theme</label><select id="sys-theme" class="form-control"><option ${data.theme==='Light'?'selected':''}>Light</option><option ${data.theme==='Dark'?'selected':''}>Dark</option></select></div>
                    <div class="form-group"><label>Date Format</label><select id="sys-date" class="form-control"><option ${data.dateFormat==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option><option ${data.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option></select></div>
                </div>
                <button class="btn-primary" id="sys-save">Save Preferences</button>
            </div>
        `;
        document.getElementById('sys-save').addEventListener('click', () => {
            updateSettings('system', {
                theme: document.getElementById('sys-theme').value,
                dateFormat: document.getElementById('sys-date').value
            });
        });
    }

    function renderBackup() {
        container.innerHTML = `
            <div class="settings-section fade-in">
                <h3>Data Export</h3>
                <p style="color:var(--text-secondary); margin-bottom: 2rem;">Export your data as CSV files for spreadsheet software.</p>
                <div class="grid-3">
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:2rem;color:var(--primary);margin-bottom:0.5rem;">payments</span>
                        <p>Income</p>
                        <button class="btn-secondary" onclick="window.open('${API_BASE}/export/income', '_blank')">Export</button>
                    </div>
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:2rem;color:var(--danger);margin-bottom:0.5rem;">receipt_long</span>
                        <p>Expenses</p>
                        <button class="btn-secondary" onclick="window.open('${API_BASE}/export/expenses', '_blank')">Export</button>
                    </div>
                    <div class="stat-card" style="text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:2rem;color:var(--success);margin-bottom:0.5rem;">groups</span>
                        <p>Attendance</p>
                        <button class="btn-secondary" onclick="window.open('${API_BASE}/export/attendance', '_blank')">Export</button>
                    </div>
                </div>
            </div>
        `;
    }
});
