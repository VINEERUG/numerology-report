// =================================================================
// users.js
// =================================----------------================

const API_BASE_URL = 'https://keshvaggrawal.pythonanywhere.com';
const GET_USERS_URL = API_BASE_URL + '/api/admin/get-users';
const SET_STATUS_URL = API_BASE_URL + '/api/admin/set-user-status';
// --- NEW ---
// Define the URL for the delete endpoint
const DELETE_USER_URL = API_BASE_URL + '/api/admin/delete-by-email'; 

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
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
        usersContainer.innerHTML = `<p class="text-red-400">A network error occurred.</p>`;
    }
};

/**
 * Renders the list of users into a table.
 * --- MODIFIED ---
 */
const renderUsers = (users) => {
    if (users.length === 0) {
        usersContainer.innerHTML = `<p>No users found.</p>`;
        return;
    }

    // --- MODIFIED TABLE STRUCTURE ---
    // Added <th>Mobile</th> and updated the row mapping to include mobilenumber and a delete button.
    const tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mobile</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${user.mobilenumber || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}">
                                    ${user.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${new Date(user.created_at).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="text-indigo-400 hover:text-indigo-300 toggle-status-btn" data-userid="${user.id}" data-status="${user.status}">
                                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <!-- --- NEW DELETE BUTTON --- -->
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
};


/**
 * Toggles the status of a user (active/inactive).
 */
const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
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
            fetchUsers(); // Refresh the list to show the new status
        } else {
            alert(`Error updating status: ${data.error}`);
        }
    } catch (err) {
        alert('A network error occurred while updating status.');
    }
};

// --- NEW ---
/**
 * Deletes a user and all their data by email.
 */
const deleteUser = async (email) => {
    // Confirmation dialog to prevent accidental deletion
    if (!confirm(`Are you sure you want to delete the user "${email}"?\nThis action cannot be undone and will remove all their reports.`)) {
        return;
    }

    try {
        const res = await fetch(DELETE_USER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: email })
        });

        const data = await res.json();
        if (data.ok) {
            alert('User deleted successfully.');
            fetchUsers(); // Refresh the user list
        } else {
            alert(`Error deleting user: ${data.error}`);
        }
    } catch (err) {
        alert('A network error occurred while deleting the user.');
    }
};

// Event delegation to handle clicks on action buttons
usersContainer.addEventListener('click', (e) => {
    const target = e.target;

    // Handle status toggle
    if (target.classList.contains('toggle-status-btn')) {
        const userId = target.dataset.userid;
        const currentStatus = target.dataset.status;
        toggleUserStatus(userId, currentStatus);
    }
    
    // --- NEW ---
    // Handle delete action
    if (target.classList.contains('delete-user-btn')) {
        const email = target.dataset.email;
        deleteUser(email);
    }
});


// Initial fetch of users when the page loads
fetchUsers();



