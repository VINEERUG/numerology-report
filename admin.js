// =============================================================================
// admin.js
//
// This script handles both the admin login page (admin.html) and the
// reports viewing page (view.html). It checks which page is active
// and runs the appropriate logic.
//
// =============================================================================

// Use relative paths for API endpoints to work with your local dev server.
const LOGIN_URL = '/api/admin-login';
const GET_REPORTS_URL = '/api/my-reports'; // This can be the same as the user's report endpoint if the backend protects it.

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
    if (reports.length === 0) {
        reportsContainer.innerHTML = '<p>No reports found.</p>';
        return;
    }

    // Create a table to display the reports
    const table = document.createElement('table');
    table.className = 'min-w-full bg-white divide-y divide-gray-200';
    table.innerHTML = `
        <thead class="bg-gray-50">
            <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View Details</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            ${reports.map(report => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">${report.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${report.firstName || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${report.dob || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button class="view-details-btn text-indigo-600 hover:text-indigo-900" data-report='${JSON.stringify(report)}'>
                            View
                        </button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    reportsContainer.innerHTML = ''; // Clear previous content
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
