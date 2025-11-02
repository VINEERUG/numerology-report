// script.js (Final Version - Using URL Data)

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
                
                // --- NEW METHOD: Pass data in URL ---
                if (data.report && !data.error) {
                    const reportData = {
                        inputs: payload,
                        results: data.report 
                    };
                    
                    // Convert the data to a JSON string
                    const jsonString = JSON.stringify(reportData);
                    
                    // Encode the string so it's safe for a URL
                    const encodedData = btoa(jsonString); // btoa = Base64 encode
                    
                    // Redirect to the report page with the data in the URL
                    window.location.href = 'report.html?data=' + encodeURIComponent(encodedData);
                    
                } else {
                    // This handles server errors
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
        });
    }
});