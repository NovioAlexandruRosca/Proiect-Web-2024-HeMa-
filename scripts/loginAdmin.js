const registerButton = document.getElementById("register");
registerButton.addEventListener("click", () => {
    window.location.href = "../html/register.html";
});

document.getElementById("Email").addEventListener("click", () => {
    document.getElementById("Email").placeholder = "";
});

document.getElementById("Password").addEventListener("click", () => {
    document.getElementById("Password").placeholder = "";
});


const emailInput = document.getElementById("Email");
const passwordInput = document.getElementById("Password");
const errorMessage = document.getElementById("Error_Message");

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login_form');
    const emailInput = document.getElementById('Email');
    const passwordInput = document.getElementById('Password');
    const errorMessage = document.getElementById('Error_Message');

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            errorMessage.textContent = "Email and password cannot be empty.";
            return;
        }

        fetch('http://localhost:3000/admin/testCredentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Authenticated successfully') {
                window.location.href = '/admin.html'; // Adjust if necessary
            } else {
                throw new Error(data.message || 'Login failed');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            document.getElementById('Error_Message').textContent = error.message || "Login failed, please try again.";
        });

    });
});



