// ------------------ FINAL CORRECTED CODE FOR admin.js ------------------
document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('login-section');
    const reportsSection = document.getElementById('reports-section');
    const logoutButton = document.getElementById('logout-button');
    const token = localStorage.getItem('adminToken');
    
    const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';

    if (token) {
        showReportsPage();
    } else {
        showLoginPage();
    }

    function showLoginPage() {
        loginSection.classList.remove('hidden');
        reportsSection.classList.add('hidden');
        logoutButton.classList.add('hidden');
    }

    function showReportsPage() {
        loginSection.classList.add('hidden');
        reportsSection.classList.remove('hidden');
        logoutButton.classList.remove('hidden');
        fetchReports(1);
    }

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

        fetch(`${API_BASE_URL}/api/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('adminToken', data.token);
                showReportsPage();
            } else {
                throw new Error(data.error || 'Login failed.');
            }
        })
        .catch(error => {
            errorMessage.textContent = error.message;
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        });
    });

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('adminToken');
        showLoginPage();
    });

    let currentPage = 1;

    function fetchReports(page) {
        const currentToken = localStorage.getItem('adminToken');
        if (!currentToken) {
            showLoginPage();
            return;
        }

        // *** THIS IS THE LINE THAT IS NOW CORRECT ***
        fetch(`${API_BASE_URL}/api/admin/reports?page=${page}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('adminToken');
                showLoginPage();
                return Promise.reject('Session expired. Please log in again.');
            }
            if (!response.ok) {
                 return response.json().then(err => { throw new Error(err.error) });
            }
            return response.json();
        })
        .then(data => {
            renderReports(data.reports);
            renderPagination(data.page, data.total_pages);
            currentPage = data.page;
        })
        .catch(error => {
            console.error('Error fetching reports:', error);
            if (String(error) !== 'Error: Session expired. Please log in again.') {
                 const tableBody = document.querySelector("#reports-table tbody");
                 if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">Error loading reports: ${error}</td></tr>`;
            }
        });
    }

    function renderReports(reports) {
        const tableBody = document.querySelector("#reports-table tbody");
        tableBody.innerHTML = '';
        if (!reports || reports.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No reports found.</td></tr>';
            return;
        }
        reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.email}</td>
                <td>${report.mobile || 'N/A'}</td>
                <td>${report.name}</td>
                <td>${report.dob}</td>
                <td>${new Date(report.created_at).toLocaleString()}</td>
                <td><button class="view-report-btn" data-report-id="${report.id}">View</button></td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.view-report-btn').forEach(button => {
            button.addEventListener('click', function() {
                const reportId = this.getAttribute('data-report-id');
                localStorage.setItem('viewReportId', reportId);
                window.location.href = 'view.html';
            });
        });
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
