const LOGIN_URL = "https://keshvaggrawal.pythonanywhere.com/api/admin-login"; // Your backend admin login endpoint
const GET_REPORTS_URL = "https://keshvaggrawal.pythonanywhere.com/api/get-reports";
const token = localStorage.getItem('adminToken');
const loginForm = document.getElementById('login-form');

// If already logged in as admin, redirect to admin view page
if (token && window.location.pathname.endsWith("admin.html")) {
    window.location.href = "view.html"; // or your actual admin dashboard page
}

// Admin login form handling
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const errorEl = document.getElementById("login-error");
        const button = document.getElementById("login-button");

        button.disabled = true;
        button.textContent = "Logging in...";
        errorEl.classList.add("hidden");

        try {
            const res = await fetch(LOGIN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.ok && data.token) {
                // Successful login: store admin session token
                localStorage.setItem('adminToken', data.token);
                window.location.href = "view.html"; // go to your admin page
            } else {
                errorEl.textContent = data.error || "Login failed.";
                errorEl.classList.remove("hidden");
            }
        } catch (err) {
            errorEl.textContent = "Network error. Could not connect to server.";
            errorEl.classList.remove("hidden");
        } finally {
            button.disabled = false;
            button.textContent = "Login";
        }
    });
}

// Example: Use adminToken to fetch admin-only data
const reportsContainer = document.getElementById('reports-container');
if (reportsContainer && token) {
    fetch(GET_REPORTS_URL, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        // populate reportsContainer with admin reports/data
    })
    .catch(() => {
        reportsContainer.textContent = "Failed to load reports";
    });
}

// On logout (add a logout button with id 'admin-logout' in your HTML)
const logoutBtn = document.getElementById('admin-logout');
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('adminToken');
        window.location.href = "admin.html"; // back to admin login
    });
}
