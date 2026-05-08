/**
 * Core Application State Management
 * FaithFlow Stewardship Portal
 */

const DB_KEY = 'faithflow_db';

// Global Authentication Guard
(function() {
    const token = localStorage.getItem('faithflow_token');
    const path = window.location.pathname;
    const isAuthPage = path.includes('login') || path.includes('register') || path.includes('forgot') || path.includes('verify') || path === '/';
    
    if (!token && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (token && isAuthPage) {
        window.location.href = 'index.html';
    }
})();

// Global db object — settings
let db = {
    settings: {
        currency: 'USD',
        darkMode: false,
        churchName: 'Grace Community Church',
        address: '123 Faith Avenue'
    }
};

// Global app settings loaded from API
window.appSettings = null;

// Load Settings from LocalStorage (legacy fallback)
function loadSettings() {
    const saved = localStorage.getItem('faithflow_settings');
    if (saved) {
        db.settings = { ...db.settings, ...JSON.parse(saved) };
    }
}

// Save Settings to LocalStorage
function saveSettings() {
    localStorage.setItem('faithflow_settings', JSON.stringify(db.settings));
}

// API Call Wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('faithflow_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };
    if (body) config.body = JSON.stringify(body);

    // Determine API base URL
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : ''; // In production (Vercel), use relative path if backend is same-domain

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('faithflow_token');
            localStorage.removeItem('faithflow_user');
            window.location.href = 'login.html';
        }
        throw new Error(data.error || 'API Error');
    }
    return data;
}

// Global API Delete Wrapper
async function apiDelete(endpoint) {
    try {
        await apiCall(endpoint, 'DELETE');
        if (typeof loadGlobalSettings === 'function') {
            await loadGlobalSettings();
        } else {
            window.location.reload();
        }
    } catch (e) {
        console.error('Delete failed:', e);
        if (typeof showToast === 'function') {
            showToast('Delete failed: ' + e.message, 'error');
        } else {
            alert('Delete failed: ' + e.message);
        }
    }
}

// Load Global Settings from API
async function loadGlobalSettings() {
    try {
        const data = await apiCall('/settings');
        window.appSettings = data;

        // Sync legacy db.settings with API data
        if (data.settings && data.settings.church_profile) {
            db.settings.churchName = data.settings.church_profile.churchName || db.settings.churchName;
            db.settings.address = data.settings.church_profile.address || db.settings.address;
            db.settings.currency = data.settings.church_profile.currency || db.settings.currency;
        }
        if (data.settings && data.settings.system) {
            const theme = data.settings.system.theme || 'Light';
            db.settings.darkMode = (theme === 'Dark');
        }

        // Apply loaded settings
        applyTheme();

        // Update church name globally
        const headerTitles = document.querySelectorAll('.header-title');
        headerTitles.forEach(el => {
            el.textContent = db.settings.churchName;
        });

        // Update Logo globally
        if (data.settings && data.settings.church_profile && data.settings.church_profile.logoUrl) {
            const logoEl = document.querySelector('.sidebar-brand-logo');
            if(logoEl) logoEl.src = data.settings.church_profile.logoUrl;
            // Also update any header logo if it exists
        }

        // Dispatch Global Event so other modules (Income, Expenses, etc.) can re-render
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: data }));

        return data;
    } catch (e) {
        console.warn('Could not load settings from API, using local fallback:', e.message);
        return null;
    }
}

// Handle Logout globally
function logout() {
    localStorage.removeItem('faithflow_token');
    localStorage.removeItem('faithflow_user');
    window.location.href = 'login.html';
}

// Format Date safely
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Theme Management
function applyTheme() {
    if (db.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Format Currency based on Settings
function formatCurrency(amount) {
    const currency = (window.appSettings && window.appSettings.settings && window.appSettings.settings.church_profile) 
                     ? window.appSettings.settings.church_profile.currency 
                     : db.settings.currency || 'USD';
                     
    const precision = (window.appSettings && window.appSettings.settings && window.appSettings.settings.financial)
                     ? window.appSettings.settings.financial.decimalPrecision 
                     : 2;

    const locales = {
        'USD': 'en-US',
        'EUR': 'de-DE',
        'GBP': 'en-GB',
        'NGN': 'en-NG',
        'ZAR': 'en-ZA',
        'KES': 'en-KE'
    };
    
    return new Intl.NumberFormat(locales[currency] || 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    }).format(amount);
}

// ============================================
// Toast Notification System
// ============================================
function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">${icons[type] || 'info'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined" style="font-size:16px">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ============================================
// Confirmation Modal
// ============================================
function showConfirmModal(title, message, onConfirm) {
    // Remove existing
    const existing = document.getElementById('globalConfirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'globalConfirmModal';
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close" id="confirmModalClose">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${message}</p>
            <div class="modal-footer">
                <button class="btn-secondary" id="confirmModalCancel">Cancel</button>
                <button class="btn-primary" style="background: linear-gradient(135deg, #ef4444, #b91c1c);" id="confirmModalOk">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById('confirmModalClose').addEventListener('click', close);
    document.getElementById('confirmModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.getElementById('confirmModalOk').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
    });
}

// Initialize App
async function initApp() {
    loadSettings();
    applyTheme();
    
    // Update Church Name globally if present in headers
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.textContent = db.settings.churchName;
    }

    // Load global settings from API
    await loadGlobalSettings();
}

// Run init on load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    applyRolePermissions();

    // Universal Modal Close Logic
    // Sidebar Toggle for Mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = ''; 
        });

        // Close sidebar when clicking a nav link on mobile
        const navLinks = sidebar.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }

    // Modal Global Handling
    window.addEventListener('click', (e) => {
        // 1. Click outside the modal content (on the overlay itself)
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // 2. Click on a close icon button at the top
        const closeBtn = e.target.closest('.modal-close');
        if (closeBtn) {
            const modal = closeBtn.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        }
        
        // 3. Click on a Cancel button
        const cancelBtn = e.target.closest('.modal-cancel-btn') || 
                          (e.target.closest('.btn-secondary') && e.target.textContent.trim().toLowerCase() === 'cancel');
        if (cancelBtn) {
            const modal = cancelBtn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                e.preventDefault(); // Prevent form submission if it's inside a form
            }
        }
    });
});

// Role-Based Access Control Frontend Rendering
function applyRolePermissions() {
    const userStr = localStorage.getItem('faithflow_user');
    if (!userStr) return; // Not logged in yet
    
    let userRole;
    try {
        const user = JSON.parse(userStr);
        userRole = user.role || 'user';
    } catch (e) {
        return;
    }

    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href || href === '#') return; // skip logout or placeholders
        
        let shouldShow = true;
        
        if (userRole === 'treasurer') {
            // Finance only, cannot access settings or attendance
            if (href.includes('attendance.html') || href.includes('settings.html') || href.includes('users')) {
                shouldShow = false;
            }
        } else if (userRole === 'attendance_admin') {
            // Attendance only
            if (href.includes('income.html') || href.includes('expenses.html') || href.includes('records.html') || href.includes('settings.html') || href.includes('billing')) {
                shouldShow = false;
            }
        } else if (userRole === 'viewer') {
            // View dashboard and reports only
            if (!href.includes('index.html') && !href.includes('reports.html')) {
                shouldShow = false;
            }
        }
        
        // Hide unauthorized menu items
        if (!shouldShow) {
            item.style.display = 'none';
        }
    });

    // Also hide add/edit buttons for Viewer globally if found
    if (userRole === 'viewer') {
        const actionBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-icon');
        actionBtns.forEach(btn => {
            // Except export buttons
            if (btn.textContent.toLowerCase().includes('export') || btn.id === 'menuToggle') return;
            btn.style.display = 'none';
        });
    }
}
