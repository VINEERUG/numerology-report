// ------------------ REPLACEMENT CODE FOR admin.js ------------------
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
    let currentPage = 1;

    function fetchReports(page) {
        fetch(`${API_BASE_URL}/api/admin/reports?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin-login.html';
                return Promise.reject('Unauthorized'); // Stop further processing
            }
            if (!response.ok) {
                 // Get text from the response to see if it's an HTML error page
                return response.text().then(text => {
                    throw new Error(`Server responded with ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            renderReports(data.reports);
            renderPagination(data.page, data.total_pages);
            currentPage = data.page;
        })
        .catch(error => {
            console.error('Error fetching reports:', error);
            const tableBody = document.querySelector("#reports-table tbody");
            tableBody.innerHTML = `<tr><td colspan="7">Error loading reports. See console for details.</td></tr>`;
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
        pageIndicator.style.margin = '0 10px';
        paginationContainer.appendChild(pageIndicator);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = page === total_pages;
        nextButton.addEventListener('click', () => fetchReports(page + 1));
        paginationContainer.appendChild(nextButton);
    }

    fetchReports(currentPage);
});
