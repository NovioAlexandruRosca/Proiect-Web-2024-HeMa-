const login_button = document.getElementById("register");

login_button.addEventListener("click",() => {
    window.location.href = "./login.html";
});

document.getElementById("Email").addEventListener("click", () => {
    document.getElementById("Email").placeholder = "";
});

document.getElementById("Password").addEventListener("click", () => {
    document.getElementById("Password").placeholder = "";
});

document.getElementById("Name").addEventListener("click", () => {
    document.getElementById("Name").placeholder = "";
});

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login_form');

    loginForm.addEventListener('submit', function (event) {

        event.preventDefault();

        const username = document.getElementById('Email').value;
        const name = document.getElementById('Name').value;
        const password = document.getElementById('Password').value;

        let auth = true;

        if(username == ""){
            document.getElementById("Email").placeholder = "Can't leave empty";
            auth = false;
        }else if(!isValidEmail(username)){
            document.getElementById("Email").placeholder = "Use a Valid Email";
            document.getElementById("Email").value = "";
            auth = false;
        }
        if(name == "")
        {
            document.getElementById("Name").placeholder = "Can't leave empty";
            auth = false;
        }
        if(password == "")
        {
            document.getElementById("Password").placeholder = "Can't leave empty";
            auth = false;
        }

        if(auth)
        {
            fetch('/registerCredentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Email: username,
                    Password: password,
                    Name:name,
                }),
            })
            .then((response) => {
                if (response.status === 401) {

                    document.getElementById("Email").value = "";
                    document.getElementById("Error_Message").innerText = "Email already exists!";
                }
                else    
                    window.location.href = "/";
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    });
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(email);
  }