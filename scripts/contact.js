//work in progress

// document.addEventListener('DOMContentLoaded', function () {
//     const contactForm = document.getElementById('contact_form');

//     contactForm.addEventListener('submit', function (event) {

//         event.preventDefault();

//         const name = document.getElementById('name_input').value;
//         const phone = document.getElementById('telephone_input').value;
//         const email = document.getElementById('das').value;
//         const message = document.getElementById('message_input').value;

//         let auth = true;

//         if(name == ""){
//             document.getElementById("name_input").placeholder = "Can't leave empty";
//             auth = false;
//         }
//         if(phone == ""){
//             document.getElementById("telephone_input").placeholder = "Can't leave empty";
//             auth = false;
//         }
//         if(email == ""){
//             document.getElementById("das").placeholder = "Can't leave empty";
//             auth = false;
//         }
//         if(message == ""){
//             document.getElementById("message_input").placeholder = "Can't leave empty";
//             auth = false;
//         }

//         if(auth){
//             fetch('/sendEmail', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     Email: username,
//                     Password: password,
//                     Name:name,
//                 }),
//             })
//             .then((response) => {
//                 if (response.status === 401) {

//                     document.getElementById("Email").value = "";
//                     document.getElementById("Error_Message").innerText = "Email already exists!";
//                 }
//                 else    
//                     window.location.href = "/";
//             })
//             .catch((error) => {
//                 console.error('Error:', error);
//             });
//         }
//     });
// });