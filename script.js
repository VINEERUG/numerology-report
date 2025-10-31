// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('numerology-form');
    const submitButton = document.getElementById('submit-button');
    const errorEl = document.getElementById('form-error');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable button and show loading text
            submitButton.disabled = true;
            submitButton.textContent = 'Calculating...';
            errorEl.classList.add('hidden');
            errorEl.textContent = '';

            // 1. GATHER THE USER'S INPUTS using FormData
            const formData = new FormData(form);
            const payload = {
                firstName: formData.get('firstName'),
                middleName: formData.get('middleName'),
                lastName: formData.get('lastName'),
                dob: formData.get('dob'),
                gender: formData.get('gender'),
                mobile: formData.get('mobile')
            };

            try {
                const res = await fetch('https://keshvaggrawal.python-anywhere.com/api/calc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                
                // 2. CHECK FOR SUCCESS ('report' key) OR FAILURE ('error' key)
                if (data.report && !data.error) {
                    
                    // 3. STORE *BOTH* INPUTS AND RESULTS
                    const reportData = {
                        inputs: payload,
                        results: data.report 
                    };
                    
                    localStorage.setItem('numerologyReport', JSON.stringify(reportData));
                    // Redirect to the report page
                    window.location.href = 'report.html';
                    
                } else {
                    // Show error from backend in the error box
                    errorEl.textContent = data.error || 'Something went wrong. Please try again.';
                    errorEl.classList.remove('hidden');
                }

            } catch(err) {
                // Handle network errors
                errorEl.textContent = 'Network error. Please check your connection and try again.';
                errorEl.classList.remove('hidden');
            } finally {
                // 4. ALWAYS RE-ENABLE THE BUTTON
                submitButton.disabled = false;
                submitButton.textContent = 'Reveal My Numbers';
            }
        });
    }
});