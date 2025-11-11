document.addEventListener('DOMContentLoaded', () => {
    
    // --- URLs ---
    const LOGIN_URL = 'https://keshvaggrawal.pythonanywhere.com/api/user-login';
    const GET_REPORTS_URL = 'https://keshvaggrawal.pythonanywhere.com/api/get-reports';
    
    const token = localStorage.getItem('adminToken');

    // --- PAGE: admin.html (Login Page) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // If we're on the login page but already have a token, redirect to view page
        if (token) {
            window.location.href = 'view.html';
            return;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
                    body: JSON.stringify({ password: password })
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

    // --- PAGE: view.html (View Reports Page) ---
    const reportsContainer = document.getElementById('reports-container');
    if (reportsContainer) {
        // If we're on the view page but have no token, redirect to login page
        if (!token) {
            window.location.href = 'admin.html';
            return;
        }

        // Handle Logout
        document.getElementById('logout-button').addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
        });

        // Fetch and display reports
        async function fetchReports() {
            try {
                const res = await fetch(GET_REPORTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token })
                });

                const data = await res.json();
                document.getElementById('loading-message').style.display = 'none';

                if (data.ok && data.reports) {
                    if (data.reports.length === 0) {
                        reportsContainer.innerHTML = '<p>No reports found.</p>';
                        return;
                    }
                    // Build HTML for each report
                    data.reports.forEach(report => {
                        const inputs = JSON.parse(report.inputs_json);
                        const results = JSON.parse(report.report_json);
                        
                        const card = document.createElement('div');
                        card.className = 'report-card';
                        
                        const name = `${inputs.firstName || ''} ${inputs.middleName || ''} ${inputs.lastName || ''}`;
                        
                        // This is the new card.innerHTML for your admin.js file

card.innerHTML = `
    <h2 class="font-serif text-2xl font-bold text-white mb-2">
        ${name.trim()}
    </h2>
    <p class="text-sm text-purple-300 mb-4">Report ID: ${report.id} | Saved: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
            <p class="text-sm text-gray-400">DOB</p>
            <p class="text-lg font-semibold text-white">${inputs.dob}</p>
        </div>
        <div>
            <p class="text-sm text-gray-400">Driver (Moolank)</p>
            <p class="text-lg font-semibold text-white">${results.driverNumber}</p>
        </div>
        <div>
            <p class="text-sm text-gray-400">Conductor (Bhagyank)</p>
            <p class="text-lg font-semibold text-white">${results.conductorNumber}</p>
        </div>
        <div>
            <p class="text-sm text-gray-400">Name Number</p>
            <p class="text-lg font-semibold text-white">${results.fullNameNumber}</p>
        </div>
        
        <div class="md:col-span-2"> 
            <p class="text-sm text-gray-400">Mobile Number</p>
            <p class="text-lg font-semibold text-white">${results.mobileNumber || 'N/A'}</p>
        </div>
        </div>
    
    <div class="mt-4 pt-4 border-t border-slate-700">
        <p class="text-sm text-gray-400">Mobile Analysis</p>
        <p class="text-white">${results.mobileAnalysis}</p>
    </div>
    <div class="mt-4 pt-4 border-t border-slate-700">
        <p class="text-sm text-gray-400">Car Analysis</p>
        <p class="text-white">${results.carAnalysis}</p>
    </div>
`;
                        reportsContainer.appendChild(card);
                    });

                } else {
                    reportsContainer.innerHTML = `<p class="text-pink-400">Error: ${data.error}</p>`;
                }

            } catch (err) {
                document.getElementById('loading-message').style.display = 'none';
                reportsContainer.innerHTML = `<p class="text-pink-400">Error: Could not fetch reports.</p>`;
            }
        }

        fetchReports();
    }

});


