// admin.js
const LOGIN_URL = 'https://keshvaggrawal.pythonanywhere.com/api/user-login'; // fixed endpoint
const GET_REPORTS_URL = 'https://keshvaggrawal.pythonanywhere.com/api/get-reports';
const token = localStorage.getItem('adminToken');
const loginForm = document.getElementById('login-form');

// Only redirect after login (NOT just because token exists)
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');
        const button = document.getElementById('login-button');
        button.disabled = true;
        button.textContent = 'Logging in...';
        errorEl.classList.add('hidden');
        try {
            const res = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            });
            const data = await res.json();
            if (data.ok && data.token) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = 'view.html';
            } else {
                errorEl.textContent = data.error || 'Login failed';
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = 'Server error.';
            errorEl.classList.remove('hidden');
        }
        button.disabled = false;
        button.textContent = 'Login';
    });
}

// Remove "if (token) { window.location.href = ... }" logic entirely!
