document.getElementById('numerologyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = e.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Calculating...';

  // 1. GATHER THE USER'S INPUTS
  const payload = {
    firstName: document.getElementById('firstName').value.trim(),
    middleName: document.getElementById('middleName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    mobile: document.getElementById('mobile').value.trim()
  };

  try {
    const res = await fetch('https://keshvaggrawal.pythonanywhere.com/api/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    // 2. CHECK FOR SUCCESS ('report' key) OR FAILURE ('error' key)
    if (data.report && !data.error) {
      
      // 3. STORE *BOTH* INPUTS AND RESULTS
      // This is so the report page can display the user's name and DOB
      const reportData = {
        inputs: payload,
        results: data.report 
      };
      
      localStorage.setItem('numerologyReport', JSON.stringify(reportData));
      window.location.href = 'report.html';
      
    } else {
      // Handle errors from the backend (e.g., "Missing required fields")
      alert('Error: ' + (data.error || 'Something went wrong.'));
    }

  } catch(err) {
    // Handle network errors (e.g., server is down)
    alert('Network error: ' + err.message);
  } finally {
    // 4. ALWAYS RE-ENABLE THE BUTTON
    submitButton.disabled = false;
    submitButton.textContent = 'Reveal My Numbers';
  }
});