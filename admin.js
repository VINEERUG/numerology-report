// ------------------ DEBUG-READY CODE FOR admin.js ------------------
document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('login-section');
    const reportsSection = document.getElementById('reports-section');
    const logoutButton = document.getElementById('logout-button');
    const token = localStorage.getItem('adminToken');
    
    const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';

    // --- Main Logic: Decide which view to show ---
    if (token) {
        console.log("Token found in localStorage. Attempting to show reports page.");
        showReportsPage();
    } else {
        console.log("No token found. Showing login page.");
        showLoginPage();
    }

    // --- UI Control Functions ---
    function showLoginPage() {
        loginSection.classList.remove('hidden');
        reportsSection.classList.add('hidden');
        logoutButton.classList.add('hidden');
    }

    function showReportsPage() {
        loginSection.classList.add('hidden');
        reportsSection.classList.remove('hidden');
        logoutButton.classList.remove('hidden');
        fetchReports(1); // Load the first page of reports
    }

    // --- Event Listener for the Login Form ---
    const loginForm = document.getElementById('admin-login-form');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const errorMessage = document.getElementById('error-message');
        const loginButton = document.getElementById('login-button');
        errorMessage.textContent = '';
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log(`Attempting to log in with email: ${email}`);

        fetch(`${API_BASE_URL}/api/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => {
            if (!response.ok) {
                // If response is not OK, get the error message from the body
                return response.json().then(errorData => {
                    // Create a detailed error to throw
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.token) {
                console.log("Login successful. Token received.");
                localStorage.setItem('adminToken', data.token);
                showReportsPage();
            } else {
                // This case should ideally not be hit if the server response is consistent
                throw new Error('Login failed: No token received from server.');
            }
        })
        .catch(error => {
            console.error('LOGIN FAILED:', error);
            errorMessage.textContent = `Login failed: ${error.message}`;
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        });
    });

    // --- Event Listener for the Logout Button ---
    logoutButton.addEventListener('click', function() {
        console.log("Logout button clicked.");
        localStorage.removeItem('adminToken');
        showLoginPage();
    });

    // --- Data Fetching and Rendering ---
    let currentPage = 1;

function fetchReports(page=1) {
  const token = localStorage.getItem('adminToken');
  fetch(`${API_BASE_URL}/api/admin/reports?page=${page}&per_page=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => {
    if (r.status === 401 || r.status === 403) throw new Error('Session expired');
    return r.json();
  })
  .then(data => {
    if (!data.ok) throw new Error(data.error || 'Failed to load');
    renderReports(data.reports);
    renderPagination(data.page, data.total_pages);
  })
  .catch(err => {
    console.error(err);
    // show error row if needed
  });
}

    // --- Render Functions (No changes needed here) ---

function renderReports(reports) {
  const tbody = document.querySelector('#reports-table tbody');
  tbody.innerHTML = '';
  if (!reports || reports.length === 0) {
     tbody.innerHTML = '<tr><td colspan="8">No reports found.</td></tr>';
     return;
  }
  reports.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.email || ''}</td>
      <td>${r.mobile_number || ''}</td>
      <td>${r.name || ''}</td>
      <td>${r.dob || ''}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
      <td><button class="view-report-btn" data-report-id="${r.id}">View</button></td>
      <td><button class="del-user-btn" data-email="${r.email || ''}">Delete User</button></td>
    `;
    tbody.appendChild(tr);
  });

  // View handlers remain same...
  document.querySelectorAll('.del-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      if (!email) return alert('No email for this row.');
      if (!confirm(`Delete ALL data for ${email}? This cannot be undone.`)) return;
      deleteByEmail(email);
    });
  });
}

function deleteByEmail(email) {
  const token = localStorage.getItem('adminToken');
  fetch(`${API_BASE_URL}/api/admin/delete-by-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ email })
  })
  .then(r => r.json())
  .then(data => {
    if (!data.ok) throw new Error(data.error || 'Delete failed');
    alert(`Deleted data for ${email}`);
    fetchReports(1);
  })
  .catch(err => alert(err.message));
}

function renderPagination(page, total_pages) {
        const paginationContainer = document.getElementById('pagination-controls');
        paginationContainer.innerHTML = '';
        if (!total_pages || total_pages <= 1) return;
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = page === 1;
        prevButton.addEventListener('click', () => fetchReports(page - 1));
        paginationContainer.appendChild(prevButton);
        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = ` Page ${page} of ${total_pages} `;
        paginationContainer.appendChild(pageIndicator);
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = page === total_pages;
        nextButton.addEventListener('click', () => fetchReports(page + 1));
        paginationContainer.appendChild(nextButton);
    }
});

