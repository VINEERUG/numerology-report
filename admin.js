// admin.js
// This script handles both the admin login page (admin.html) and the
// reports viewing page (view.html). It checks which page is active
// and runs the appropriate logic.
// ===================================================================

// Use the full URL of your PythonAnywhere server.
const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
const LOGIN_URL = `${API_BASE_URL}/api/admin-login`;
const GET_REPORTS_URL = `${API_BASE_URL}/api/my-reports`;

const token = localStorage.getItem('adminToken');

// --- 1. LOGIN PAGE LOGIC (runs if it finds the login form) ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    // If we're on the login page but already have a token, redirect to the view page.
    if (token) {
        window.location.href = 'view.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');
        const button = document.getElementById('login-button');

        // Provide user feedback
        button.disabled = true;
        button.textContent = 'Logging in...';
        errorEl.classList.add('hidden');

        try {
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = 'view.html'; // Redirect to the reports view
            } else {
                errorEl.textContent = data.error || 'Login failed. Please try again.';
                errorEl.classList.remove('hidden');
            }
        } catch (error) {
            errorEl.textContent = 'An error occurred. Please check your connection.';
            errorEl.classList.remove('hidden');
        } finally {
            button.disabled = false;
            button.textContent = 'Login';
        }
    });
}


// --- 2. VIEW REPORTS PAGE LOGIC (runs if it finds the reports container) ---
const reportsContainer = document.getElementById('reports-container');
if (reportsContainer) {
    // If we're on the view page but have no token, redirect to the login page.
    if (!token) {
        window.location.href = 'admin.html';
    } else {
        fetchAndRenderReports();
    }
}

// Function to fetch all reports from the API
async function fetchAndRenderReports() {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = '<p class="text-center p-8 text-gray-400">Loading reports...</p>';

    try {
        const response = await fetch(GET_REPORTS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            // If token is invalid or expired, clear it and redirect to login
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
            return;
        }

        const data = await response.json();

        if (data.ok) {
            renderReports(data.reports);
        } else {
            reportsContainer.innerHTML = `<p class="text-center p-8 text-red-500">Error: ${data.error}</p>`;
        }
    } catch (err) {
        reportsContainer.innerHTML = '<p class="text-center p-8 text-red-500">Failed to fetch reports. Please check your connection.</p>';
    }
}

// Function to render the reports into a table
function renderReports(reports) {
    const reportsContainer = document.getElementById('reports-container');
    if (!reports || reports.length === 0) {
        reportsContainer.innerHTML = '<p class="text-center p-8 text-gray-400">No reports have been generated yet.</p>';
        return;
    }

    let tableHTML = `
        <table class="min-w-full">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>User Details</th>
                    <th>Name</th>
                    <th>Driver #</th>
                    <th>Conductor #</th>
                    <th>View</th>
                </tr>
            </thead>
            <tbody>
    `;

    reports.forEach(report => {
        const timestamp = new Date(report.timestamp).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        const userDetailsHTML = report.user_email
            ? `<div>
                   <div class="font-semibold">${report.user_email}</div>
                   ${report.user_mobile ? `<div class="text-gray-400">${report.user_mobile}</div>` : ''}
               </div>`
            : '<span class="text-gray-500">Guest</span>';

        tableHTML += `
            <tr>
                <td>${timestamp}</td>
                <td>${userDetailsHTML}</td>
                <td>${report.inputs_data.firstName} ${report.inputs_data.lastName || ''}</td>
                <td>${report.report_data.driver_number}</td>
                <td>${report.report_data.conductor_number}</td>
                <td>
                    <button class="btn-view-report" onclick="viewReportDetails('${report.id}', '${report.report_data.full_report_url}')">View</button>
                </td>
            </tr>
        `;
    }); // <-- The incorrect semicolon was here

    tableHTML += `
            </tbody>
        </table>
    `;
    reportsContainer.innerHTML = tableHTML;
}

// Function to handle viewing report details
function viewReportDetails(reportId, reportUrl) {
    if (reportUrl) {
        // If there's a URL, open it in a new tab
        window.open(reportUrl, '_blank');
    } else {
        // Fallback for older reports or if URL is missing
        alert(`Viewing details for report ID: ${reportId}\n(No URL found)`);
    }
}

// --- 3. LOGOUT BUTTON LOGIC (runs on pages with a logout button) ---
const logoutButton = document.getElementById('logout-btn');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin.html';
    });
}
