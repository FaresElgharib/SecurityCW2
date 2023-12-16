// Password Requirements
document.getElementById('signup-form').addEventListener('submit', function(event) {
    var password = document.querySelector('#signup-form input[type="password"]').value;
    var errorMessage = '';

    if (!/[A-Z]/.test(password)) {
        errorMessage += 'Password must include at least one capital letter.\n';
    }
    if (password.length < 8) {
        errorMessage += 'Password must be at least 8 characters long.\n';
    }

    if (errorMessage) {
        alert(errorMessage);
        event.preventDefault(); // Prevent form submission
    }
});

// Handling the Registration
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = this.querySelector('input[type="text"]').value;
            const password = this.querySelector('input[type="password"]').value;
            const role = this.querySelector('select').value;

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role }),
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                // Additional actions on successful registration
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        });
    }
});


// Handling the Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = this.querySelector('input[type="text"]').value;
        const password = this.querySelector('input[type="password"]').value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Store the token and redirect or update UI
                sessionStorage.setItem('authToken', data.token);
                alert('Login successful');
                // Decode the token to get user role
                const base64Url = data.token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                sessionStorage.setItem('userRole', payload.role);
                sessionStorage.setItem('userId', data.userId); // Store the user ID
        
                // Prompt for 2FA code
                setTimeout(() => { // Use setTimeout to ensure the prompt is properly displayed
                    const twoFactorCode = prompt("Enter your 2FA code", "");
                    if (twoFactorCode) {
                        validateTwoFactorCode(twoFactorCode);
                    }
                }, 100);
            } 
            
            else {
                alert(data.message || 'Login failed');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
}

// Validation of the 2FA code
function validateTwoFactorCode(twoFactorCode) {
    const userId = sessionStorage.getItem('userId');
    const token = sessionStorage.getItem('authToken');

    fetch('/validate-2fa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, twoFactorCode }),
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/store'; // Redirect to store on successful 2FA validation
        } else {
            alert('Invalid 2FA code');
            // Optionally, redirect back to login or allow retry
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}