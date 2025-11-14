// =============================================================================
// admin.js
//
// This script handles both the admin login page (admin.html) and the
// reports viewing page (view.html). It checks which page is active
// and runs the appropriate logic.
//
// =============================================================================

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
            const res = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok && data.token) {
                // SUCCESS! Save the token and redirect to the view page.
                localStorage.setItem('adminToken', data.token);
                window.location.href = 'view.html';
            } else {
                // Show a specific error from the server, or a generic one.
                errorEl.textContent = data.error || `Login failed (Status: ${res.status})`;
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            console.error('Login Fetch Error:', err);
            errorEl.textContent = 'Network error. Could not connect to the server.';
            errorEl.classList.remove('hidden');
        } finally {
            // Re-enable the button
            button.disabled = false;
            button.textContent = 'Login';
        }
    });
}


// --- 2. VIEW REPORTS PAGE LOGIC (runs if it finds the reports container) ---
const reportsContainer = document.getElementById('reports-container');
const logoutButton = document.getElementById('logout-button');

if (reportsContainer) {
    // If we're on the view page but have no token, redirect back to the login page.
    if (!token) {
        window.location.href = 'admin.html';
    } else {
        // If the logout button exists, add a click listener.
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin.html';
            });
        }

        // Fetch and display all user reports.
        const fetchReports = async () => {
            try {
                const res = await fetch(GET_REPORTS_URL, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (res.ok && data.reports) {
                    renderReports(data.reports);
                } else if (res.status === 401) {
                    // If token is invalid/expired, clear it and redirect to login.
                    localStorage.removeItem('adminToken');
                    window.location.href = 'admin.html';
                } else {
                    reportsContainer.innerHTML = `<p class="text-red-500">Error: ${data.error || 'Could not fetch reports.'}</p>`;
                }
            } catch (err) {
                console.error('Fetch Reports Error:', err);
                reportsContainer.innerHTML = '<p class="text-red-500">A network error occurred while fetching reports.</p>';
            }
        };

        fetchReports();
    }
}

// --- 3. UTILITY FUNCTIONS ---

/**
 * Renders the list of reports into the reportsContainer.
 * @param {Array} reports - An array of report objects from the API.
 */

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

        // --- NEW: User Details Logic ---
        // This block creates the HTML for the user details, including email and mobile.
        // It displays "Guest" if the user is not registered.
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
                    <button class="btn-view-report" data-report-id="${report.id}" onclick="viewReportDetails(${report.id})">View</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    reportsContainer.innerHTML = tableHTML;
}
    reportsContainer.appendChild(table);

    // Add event listeners for the "View" buttons (event delegation)
    reportsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            const reportData = JSON.parse(e.target.dataset.report);
            // Here you can implement a modal or a separate view to show the full report details
            alert(`Viewing details for report ID: ${reportData.id}\n\nFull Data:\n${JSON.stringify(reportData, null, 2)}`);
        }
    });
}

