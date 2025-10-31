document.getElementById('numerologyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
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
    if(data.ok){
      localStorage.setItem('numerologyReport', JSON.stringify(data));
      window.location.href = 'report.html';
    }else{
      alert('Error: ' + (data.error || 'Something went wrong.'));
    }
  } catch(err){
    alert('Network error: ' + err.message);
  }
});
