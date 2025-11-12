const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
const GET_USERS_URL = `${API_BASE_URL}/api/admin/get-users`;
const SET_STATUS_URL = `${API_BASE_URL}/api/admin/set-user-status`;
const DELETE_USER_URL = `${API_BASE_URL}/api/admin/delete-user`;
const RESET_PASS_URL = `${API_BASE_URL}/api/admin/reset-password`;

const token = localStorage.getItem('adminToken');
const usersContainer = document.getElementById('users-container');
const paginationControls = document.getElementById('pagination-controls');

// --- State ---
let currentPage = 1;

// --- Initial Check ---
if (!token) { window.location.href = 'admin.html'; }

// --- Functions ---
const fetchUsers = async (page = 1) => {
    usersContainer.innerHTML = '<p>Loading users...</p>';
    try {
        const res = await fetch(`${GET_USERS_URL}?page=${page}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
            return;
        }
        const data = await res.json();
        if (data.ok) {
            currentPage = data.pagination.current_page;
            renderUsers(data.users);
            renderPagination(data.pagination);
        } else {
            usersContainer.innerHTML = `<p class="text-red-400">Error: ${data.error}</p>`;
        }
    } catch (err) {
        usersContainer.innerHTML = '<p class="text-red-400">A network error occurred.</p>';
    }
};

function renderUsers(users) {
    if (users.length === 0) {
        usersContainer.innerHTML = '<p>No users found on this page.</p>';
        return;
    }
    const table = `
        <table class="min-w-full divide-y divide-gray-700">
            <thead>
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
                ${users.map(user => `
                    <tr>
                        <td class="px-4 py-4">
                            <div class="font-medium">${user.email}</div>
                            <div class="text-sm text-gray-400">${user.mobile_number || 'No mobile'}</div>
                        </td>
                        <td class="px-4 py-4">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-yellow-800 text-yellow-200' : (user.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300')}">
                                ${user.role === 'admin' ? 'Admin' : user.status}
                            </span>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-400">${new Date(user.created_at).toLocaleDateString()}</td>
                        <td class="px-4 py-4 text-sm font-medium">
                            <button class="toggle-status-btn text-blue-400 hover:text-blue-300" data-userid="${user.id}" data-status="${user.status}">${user.status === 'active' ? 'Deactivate' : 'Activate'}</button> /
                            <button class="reset-pass-btn text-yellow-400 hover:text-yellow-300" data-userid="${user.id}">Reset Pass</button> /
                            <button class="delete-btn text-red-500 hover:text-red-400" data-userid="${user.id}" data-email="${user.email}">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    usersContainer.innerHTML = table;
}

function renderPagination(pagination) {
    const { current_page, total_pages, total_users } = pagination;
    paginationControls.innerHTML = `
        <span class="text-sm text-gray-400">Total Users: ${total_users}</span>
        <div>
            <button id="prev-page" class="px-4 py-2 bg-gray-700 rounded ${current_page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">Previous</button>
            <span class="px-4">Page ${current_page} of ${total_pages}</span>
            <button id="next-page" class="px-4 py-2 bg-gray-700 rounded ${current_page === total_pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}">Next</button>
        </div>
    `;
    if (current_page > 1) {
        document.getElementById('prev-page').addEventListener('click', () => fetchUsers(current_page - 1));
    }
    if (current_page < total_pages) {
        document.getElementById('next-page').addEventListener('click', () => fetchUsers(current_page + 1));
    }
}

async function handleAction(url, userId, confirmMessage, successMessage) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        if (data.ok) {
            alert(successMessage || data.message);
            // If it's a reset password, show the new password
            if (data.new_password) {
                 prompt("Please copy the new password:", data.new_password);
            }
            fetchUsers(currentPage); // Refresh list
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert('A network error occurred.');
    }
}

// --- Event Listeners ---
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin.html';
});

usersContainer.addEventListener('click', (e) => {
    const target = e.target;
    const userId = target.dataset.userid;
    if (!userId) return;

    if (target.classList.contains('delete-btn')) {
        handleAction(DELETE_USER_URL, userId, `Are you sure you want to PERMANENTLY DELETE user ${target.dataset.email} and all their reports? This cannot be undone.`);
    } else if (target.classList.contains('reset-pass-btn')) {
        handleAction(RESET_PASS_URL, userId, `Are you sure you want to reset the password for this user?`, 'Password has been reset.');
    } else if (target.classList.contains('toggle-status-btn')) {
        const newStatus = target.dataset.status === 'active' ? 'inactive' : 'active';
        handleAction(SET_STATUS_URL, userId, null, 'User status updated.').then(() => {
             // This is a bit of a workaround because handleAction is generic now
             // For a more robust app, you would separate the logic more.
             // For now, we just refresh.
             fetchUsers(currentPage);
        });
    }
});

document.addEventListener('DOMContentLoaded', () => fetchUsers(currentPage));
