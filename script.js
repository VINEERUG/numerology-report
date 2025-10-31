// script.js (Corrected URL)

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('numerology-form');
    const submitButton = document.getElementById('submit-button');
    const errorEl = document.getElementById('form-error');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitButton.disabled = true;
            submitButton.textContent = 'Calculating...';
            errorEl.classList.add('hidden');
            errorEl.textContent = '';

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
                // --- THIS IS THE FIX ---
                // The URL is now correct (no hyphen)
                const res = await fetch('https://keshvaggrawal.pythonanywhere.com/api/calc', {
                // --- END FIX ---
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                
                if (data.report && !data.error) {
                    const reportData = {
                        inputs: payload,
                        results: data.report 
                    };
                    
                    localStorage.setItem('numerologyReport', JSON.stringify(reportData));
                    window.location.href = 'report.html';
                    
                } else {
                    errorEl.textContent = data.error || 'Something went wrong. Please try again.';
                    errorEl.classList.remove('hidden');
                }

            } catch(err) {
                // This is the error you are seeing
                console.error('Fetch Error:', err);
                errorEl.textContent = 'Network error. Please check your connection and try again.';
                errorEl.classList.remove('hidden');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Reveal My Numbers';
            }
        });
    }
});