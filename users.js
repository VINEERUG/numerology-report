// =================================================================
// users.js - Final Corrected Version
// =================================================================

const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
const GET_USERS_URL = `${API_BASE_URL}/api/admin/get-users`;
const SET_STATUS_URL = `${API_BASE_URL}/api/admin/set-user-status`;
const DELETE_USER_URL = `${API_BASE_URL}/api/admin/delete-by-email`;

const usersContainer = document.getElementById('users-container');
const token = localStorage.getItem('adminToken');

// --- Main Logic ---

// Immediately check for a token. If it's missing, redirect to the admin login page.
if (!token) {
    window.location.href = 'admin.html';
}

// Function to fetch all users from the API
async function fetchUsers() {
    if (!token) return;

    usersContainer.innerHTML = '<p class="text-white">Loading users...</p>';

    try {
        const response = await fetch(GET_USERS_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin.html';
            return;
        }

        const data = await response.json();

        if (data.ok && data.users) {
            renderUsers(data.users);
        } else {
            usersContainer.innerHTML = `<p class="text-red-500">Error: ${data.error || 'Could not fetch users.'}</p>`;
        }
    } catch (error) {
        console.error('Fetch users error:', error);
        usersContainer.innerHTML = '<p class="text-red-500">Error: A network error occurred.</p>';
    }
}

// Function to render the list of users into the HTML table
function renderUsers(users) {
    if (users.length === 0) {
        usersContainer.innerHTML = '<p class="text-white">No users found.</p>';
        return;
    }

    const tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-700">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mobile</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${user.mobilenumber || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}">
                                    ${user.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${new Date(user.created_at).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="text-indigo-400 hover:text-indigo-300 toggle-status-btn" data-userid="${user.id}" data-status="${user.status}">
                                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button class="text-red-400 hover:text-red-300 ml-4 delete-user-btn" data-email="${user.email}">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    usersContainer.innerHTML = tableHTML;
}

// Function to toggle a user's status (active/inactive)
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
        const response = await fetch(SET_STATUS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId, status: newStatus })
        });
        const result = await response.json();
        if (result.ok) {
            fetchUsers();
        } else {
            alert(`Error updating status: ${result.error}`);
        }
    } catch (error) {
        console.error('Toggle status error:', error);
    }
}

// Function to delete a user by email
async function deleteUser(email) {
    if (!confirm(`Are you sure you want to permanently delete the user with email: ${email}? This cannot be undone.`)) {
        return;
    }
    try {
        const response = await fetch(DELETE_USER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email: email })
        });
        const result = await response.json();
        if (result.ok) {
            alert('User deleted successfully.');
            fetchUsers();
        } else {
            alert(`Error deleting user: ${result.error}`);
        }
    } catch (error) {
        console.error('Delete user error:', error);
    }
}

// Event delegation for handling clicks on action buttons
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('toggle-status-btn')) {
        const userId = event.target.getAttribute('data-userid');
        const currentStatus = event.target.getAttribute('data-status');
        toggleUserStatus(userId, currentStatus);
    }
    if (event.target.classList.contains('delete-user-btn')) {
        const userEmail = event.target.getAttribute('data-email');
        deleteUser(userEmail);
    }
});

// Initial fetch of users when the page loads
fetchUsers();
