// document.addEventListener("DOMContentLoaded", function() {

//         document.getElementById('login_form').addEventListener("submit", function(event) {
//         event.preventDefault();

//         if(localStorage.getItem('clientIsAdmin') == 'true'){
//             window.location.href = './admin.html';
//         }else{
//             window.location.href = './index.html';
//         }
//     });
// });

const register_button = document.getElementById("register");

register_button.addEventListener("click",() => {
    window.location.href = "./register.html";
});

document.getElementById("Email").addEventListener("click", () => {
    document.getElementById("Email").placeholder = "";
});

document.getElementById("Password").addEventListener("click", () => {
    document.getElementById("Password").placeholder = "";
});

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

        if(auth)
        {
            fetch('/testCredentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Email: username,
                    Password: password,
                    IsAdmin: localStorage.getItem('clientIsAdmin'),
                }),
            })
            .then((response) => {
                if (response.status === 401) {
                    document.getElementById("Error_Message").innerText = "Invalid Credentials!";
                }
                else if(response.status === 200){
                    const logicType = response.headers.get('isAdmin');

                    if(logicType == 'Yes')
                        window.location.href = "/admin.html";
                    else
                        window.location.href = "/index.html";
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    });
});
