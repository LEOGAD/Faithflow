// Ensure logout is truly global
window.logout = function() {
    localStorage.removeItem('faithflow_token');
    localStorage.removeItem('faithflow_user');
    window.location.href = '/';
}

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : ''; // In production (Vercel), use relative path

document.addEventListener('DOMContentLoaded', () => {
    
    // Auto-redirect if logged in (except on logout or auth pages)
    const token = localStorage.getItem('faithflow_token');
    const path = window.location.pathname;
    const isAuthPage = path.includes('login') || path.includes('register') || path.includes('forgot') || path.includes('verify') || path === '/';
    
    if (token && isAuthPage) {
        window.location.href = 'index.html';
    } else if (!token && !isAuthPage) {
        window.location.href = 'login.html';
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const verifyForm = document.getElementById('verifyForm');
    const errMsg = document.getElementById('errorMessage');
    const succMsg = document.getElementById('successMessage');

    function showError(msg) {
        if(errMsg) {
            errMsg.textContent = msg;
            errMsg.style.display = 'block';
        }
    }
    
    function showSuccess(msg) {
        if(succMsg) {
            succMsg.textContent = msg;
            succMsg.style.display = 'block';
        }
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const churchName = document.getElementById('churchName')?.value || '';
            const churchAddress = document.getElementById('churchAddress')?.value || '';
            const churchPhone = document.getElementById('churchPhone')?.value || '';
            
            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, churchName, churchAddress, churchPhone })
                });
                const data = await res.json();
                
                if (res.ok) {
                    if (data.requiresVerification) {
                        sessionStorage.setItem('verify_email', data.email);
                        window.location.href = 'verify.html';
                    } else if (data.token) {
                        localStorage.setItem('faithflow_token', data.token);
                        localStorage.setItem('faithflow_user', JSON.stringify(data.user));
                        window.location.href = 'index.html';
                    }
                } else {
                    showError(data.error);
                }
            } catch (err) {
                showError('Server connection failed.');
            }
        });
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = sessionStorage.getItem('verify_email');
            const otp = document.getElementById('otp').value;
            
            try {
                const res = await fetch(`${API_BASE}/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });
                const data = await res.json();
                
                if (res.ok) {
                    localStorage.setItem('faithflow_token', data.token);
                    localStorage.setItem('faithflow_user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    showError(data.error);
                }
            } catch (err) {
                showError('Verification failed.');
            }
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    localStorage.setItem('faithflow_token', data.token);
                    localStorage.setItem('faithflow_user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    showError(data.error);
                }
            } catch (err) {
                showError('Server connection failed.');
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const newPassword = document.getElementById('newPassword').value;
            
            try {
                const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, newPassword })
                });
                const data = await res.json();
                
                if (res.ok) {
                    if(errMsg) errMsg.style.display = 'none';
                    showSuccess(data.message);
                    forgotForm.reset();
                } else {
                    showError(data.error);
                }
            } catch (err) {
                showError('Server connection failed.');
            }
        });
    }
});
