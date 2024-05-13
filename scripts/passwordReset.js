
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login_form');

    loginForm.addEventListener('submit', function (event) {

        event.preventDefault();

        const username = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        let auth = true;

        if(username == "") 
        {
            document.getElementById("Email").placeholder = "Can't leave empty";
            auth = false;
        }
        if(password == "")
        {
            document.getElementById("Password").placeholder = "Can't leave empty";
            auth = false;
        }

        if(password != username){
            document.getElementById('Error_Message').innerText = "The passwords dont match!";
        }

        if(auth)
        {
            fetch('/api/updatePassword', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Password: password,
                    Email: window.location.href.split('$')[1].substring(6),
                }),
            })
            .then((response) => {
                if(response.status === 500){
                    document.getElementById("Error_Message").innerText = "Internal Error!";
                }
                else if(response.status === 200){
                    window.location.href = "/index.html";
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    });
});