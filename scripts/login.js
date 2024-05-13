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

    if(localStorage.getItem('clientIsAdmin') == 'true'){
        document.getElementById('resetPassword').style.display = 'none';
    }

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
                }else if(response.status === 500){
                    document.getElementById("Error_Message").innerText = "Internal Error!";
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

const modal = document.getElementById("resetPasswordModal");
const btn = document.getElementById("resetPassword");
const span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
  modal.style.display = "block";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

const resetPasswordForm = document.getElementById("resetPasswordForm");

resetPasswordForm.addEventListener('submit', function(event) {
  event.preventDefault(); 
  
  let formData = new FormData(resetPasswordForm);
  let email = formData.get('resetEmail');

  fetch('/api/reset-password', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
  })
  .then(response => {
      if (response.ok) {
          console.log('Password reset email sent successfully.');
          document.getElementById("resetPasswordForm").reset(); 
          modal.style.display = "none";
          document.getElementById("Error_Message").innerText = "Check Emails!";
      } else if (response.status === 500) {
          document.getElementById("Error_Message").innerText = "Internal Error!";
      } else if (response.status === 404) {
          document.getElementById("Error_Message").innerText = "Email not found";
      } else {
          console.error('Error sending password reset email.');
      }
  })
  .catch(error => {
      console.error('An error occurred:', error);
  });
});