// =================================================================
// admin.js - Complete Version with Pagination and Dark Theme Logic
// =================================================================

document.addEventListener('DOMContentLoaded', function() {

    const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
    const GET_REPORTS_URL = `${API_BASE_URL}/api/admin/get-all-reports`;

    const reportsContainer = document.getElementById('reports-container');
    const paginationContainer = document.getElementById('pagination-controls');
    const logoutBtn = document.getElementById('logout-btn');

    const token = localStorage.getItem('adminToken');
    let allReports = [];
    let currentPage = 1;
    const recordsPerPage = 10;

    // --- Main Functions ---

    // Function to fetch all reports from the server
    async function fetchAllReports() {
        if (!token) {
            window.location.href = 'admin.html';
            return;
        }

        reportsContainer.innerHTML = '<p class="p-8 text-center">Loading all reports...</p>';

        try {
            const response = await fetch(GET_REPORTS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin.html';
                return;
            }

            const data = await response.json();

            if (data.ok && data.reports) {
                allReports = data.reports;
                renderPage(currentPage);
            } else {
                reportsContainer.innerHTML = `<p class="p-8 text-red-500">Error: ${data.error || 'Could not fetch reports.'}</p>`;
            }
        } catch (error) {
            console.error('Fetch reports error:', error);
            reportsContainer.innerHTML = '<p class="p-8 text-red-500">A network error occurred.</p>';
        }
    }

    // Function to render a specific page of reports
    function renderPage(page) {
        currentPage = page;
        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedReports = allReports.slice(startIndex, endIndex);

        renderReportsTable(paginatedReports);
        renderPaginationControls();
    }

    // Function to create and render the reports table
    function renderReportsTable(reports) {
        if (reports.length === 0) {
            reportsContainer.innerHTML = '<p class="p-8 text-center">No reports found.</p>';
            return;
        }

        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Name</th>
                            <th>Date of Birth</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>View Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(report => `
                            <tr>
                                <td>${report.id}</td>
                                <td>${report.inputs_data.firstName || 'N/A'}</td>
                                <td>${report.inputs_data.dob || 'N/A'}</td>
                                <td>${report.user_email || 'N/A'}</td>
                                <td>${report.inputs_data.mobile || 'N/A'}</td>
                                <td>
                                    <a href="report.html?id=${report.id}" class="btn-link">View</a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        reportsContainer.innerHTML = tableHTML;
    }

    // Function to create and render the pagination buttons
    function renderPaginationControls() {
        const totalPages = Math.ceil(allReports.length / recordsPerPage);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';

        paginationContainer.innerHTML = `
            <button id="prev-page" class="btn pagination-btn" ${prevDisabled}>Previous</button>
            <span class="text-gray-400">
                Page ${currentPage} of ${totalPages}
            </span>
            <button id="next-page" class="btn pagination-btn" ${nextDisabled}>Next</button>
        `;
    }
    
    // --- Event Listeners ---

    // Logout button
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
        });
    }

    // Pagination buttons (using event delegation)
    paginationContainer.addEventListener('click', (event) => {
        if (event.target.id === 'prev-page' && currentPage > 1) {
            renderPage(currentPage - 1);
        }
        if (event.target.id === 'next-page' && currentPage < Math.ceil(allReports.length / recordsPerPage)) {
            renderPage(currentPage + 1);
        }
    });

    // --- Initial Call ---
    fetchAllReports();
});
