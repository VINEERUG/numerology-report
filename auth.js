// Inside auth.js
document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      window.location.href = 'admin.html';
    });
  }
});
