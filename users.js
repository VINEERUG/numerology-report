// ------------------ REPLACEMENT CODE FOR users.js ------------------
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    let currentPage = 1;

    function fetchUsers(page) {
        fetch(\https://keshvaggrawal.pythonanywhere.com/api/admin/users?page=\${page}\`, {`
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin-login.html';
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            renderUsers(data.users);
            renderPagination(data.page, data.total_pages);
            currentPage = data.page;
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            const tableBody = document.querySelector("#users-table tbody");
            tableBody.innerHTML = `<tr><td colspan="5">Error loading users: ${error.message}</td></tr>`;
        });
    }

    function renderUsers(users) {
        const tableBody = document.querySelector("#users-table tbody");
        tableBody.innerHTML = '';
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.mobile || 'N/A'}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderPagination(page, total_pages) {
        const paginationContainer = document.getElementById('pagination-controls');
        paginationContainer.innerHTML = '';

        if (total_pages <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = page === 1;
        prevButton.addEventListener('click', () => fetchUsers(page - 1));
        paginationContainer.appendChild(prevButton);

        // Page number indicator
        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = ` Page ${page} of ${total_pages} `;
        pageIndicator.style.margin = '0 10px';
        paginationContainer.appendChild(pageIndicator);

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = page === total_pages;
        nextButton.addEventListener('click', () => fetchUsers(page + 1));
        paginationContainer.appendChild(nextButton);
    }

    fetchUsers(currentPage);
});

