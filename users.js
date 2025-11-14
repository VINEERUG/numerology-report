const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
const GET_USERS_URL = `${API_BASE_URL}/api/admin/get-users`;
const SET_STATUS_URL = `${API_BASE_URL}/api/admin/set-user-status`;

const token = localStorage.getItem('adminToken');
const usersContainer = document.getElementById('users-container');
const logoutButton = document.getElementById('logout-button');

// Redirect to login if no token is found
if (!token) {
    window.location.href = 'admin.html';
}

// Handle logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin.html';
});

/**
 * Fetches all users from the API and renders them.
 */
const fetchUsers = async () => {
    try {
        const res = await fetch(GET_USERS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
            return;
        }

        const data = await res.json();
        if (data.ok) {
            renderUsers(data.users);
        } else {
            usersContainer.innerHTML = `<p class="text-red-400">Error: ${data.error}</p>`;
        }
    } catch (err) {
        usersContainer.innerHTML = '<p class="text-red-400">A network error occurred.</p>';
    }
};

/**
 * Renders the list of users into a table.
 * @param {Array} users - An array of user objects.
 */
function renderUsers(users) {
    if (users.length === 0) {
        usersContainer.innerHTML = '<p>No users found.</p>';
        return;
    }

    const table = `
        <table class="min-w-full divide-y divide-gray-700">
            <thead class="bg-gray-700">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
                ${users.map(user => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">
                                ${user.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${new Date(user.created_at).toLocaleDateString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <button class="toggle-status-btn text-indigo-400 hover:text-indigo-300" data-userid="${user.id}" data-status="${user.status}">
                                ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    usersContainer.innerHTML = table;
}

/**
 * Handles the click event for toggling user status.
 */
async function handleToggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmation = confirm(`Are you sure you want to set user ${userId} to '${newStatus}'?`);

    if (!confirmation) return;

    try {
        const res = await fetch(SET_STATUS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, status: newStatus })
        });

        const data = await res.json();
        if (data.ok) {
            fetchUsers(); // Refresh the list
        } else {
            alert(`Failed to update status: ${data.error}`);
        }
    } catch (err) {
        alert('A network error occurred while updating status.');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', fetchUsers);
usersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle-status-btn')) {
        const userId = e.target.dataset.userid;
        const status = e.target.dataset.status;
        handleToggleStatus(Number(userId), status);
    }
});
