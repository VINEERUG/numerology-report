// script.js (Corrected File with setTimeout fix)

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
                mobile: formData.get('mobile'),
                carNumber: formData.get('carNumber')
            };

            try {
                // This URL is correct.
                const res = await fetch('https://keshvaggrawal.pythonanywhere.com/api/calc', {
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
                    
                    // --- THIS IS THE FIX ---
                    // Add a 300ms delay to ensure localStorage has time to
                    // save before the browser redirects to the new page.
                    setTimeout(() => {
                        window.location.href = 'report.html';
                    }, 300); // 300 milliseconds
                    
                } else {
                    // This handles server errors (e.g., if you enter a bad date)
                    errorEl.textContent = data.error || 'Something went wrong. Please try again.';
                    errorEl.classList.remove('hidden');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reveal My Numbers';
                }

            } catch(err) {
                // This handles network errors (server is down)
                console.error('Fetch Error:', err);
                errorEl.textContent = 'Network error. Please check your connection and try again.';
                errorEl.classList.remove('hidden');
                submitButton.disabled = false;
                submitButton.textContent = 'Reveal My Numbers';
            }
            // We removed 'finally' so the button stays disabled on success
        });
    }

});
