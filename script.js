document.getElementById('numerologyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitButton = e.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Calculating...';

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
    
    // Check for 'report' (from success) or 'error' (from failure)
    if(data.report && !data.error){
      
      // Store BOTH the user's inputs and the backend's results
      const reportData = {
        inputs: payload,
        results: data.report 
      };
      
      localStorage.setItem('numerologyReport', JSON.stringify(reportData));
      window.location.href = 'report.html';
      
    } else {
      alert('Error: ' + (data.error || 'Something went wrong.'));
    }

  } catch(err){
    alert('Network error: 's + err.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Reveal My Numbers';
  }
});