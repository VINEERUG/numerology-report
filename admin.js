const LOGIN_URL = 'https://keshvaggrawal.pythonanywhere.com/api/user-login';
const GET_REPORTS_URL = 'https://keshvaggrawal.pythonanywhere.com/api/get-reports';
const token = localStorage.getItem('adminToken');
const loginForm = document.getElementById('login-form');

if (loginForm) {
  // If we're on the login page but already have a token, redirect to view page
  if (token) {
    window.location.href = 'view.html';
  }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.ok && data.token) {
        // SUCCESS! Save the token and redirect
        localStorage.setItem('adminToken', data.token);
        window.location.href = 'view.html';
      } else {
        errorEl.textContent = data.error || 'Login failed.';
        errorEl.classList.remove('hidden');
      }
    } catch (err) {
      errorEl.textContent = 'Network error. Could not connect to server.';
      errorEl.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = 'Login';
    }
  });
}

// (The rest of your admin.js code for the view page can follow here)
// For example:
const reportsContainer = document.getElementById('reports-container');
if (reportsContainer) {
    // ... your logic for the view.html page ...
}

