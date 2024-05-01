document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contact_form');

    contactForm.addEventListener('submit', function (event) {

        event.preventDefault();

        const name = document.getElementById('name_input').value;
        const phone = document.getElementById('telephone_input').value;
        const email = document.getElementById('das').value;
        const message = document.getElementById('message_input').value;
        const subject = document.getElementById('subject_input').value;

        let auth = true;

        if(name == ""){
            document.getElementById("name_input").placeholder = "Can't leave empty";
            auth = false;
        }
        if(phone == ""){
            document.getElementById("telephone_input").placeholder = "Can't leave empty";
            auth = false;
        }else if(!isRomanianPhoneNumber(phone)){
            document.getElementById("telephone_input").placeholder = "Use a Romanian Number";
            document.getElementById("telephone_input").value = "";
            auth = false;
        }
        if(email == ""){
            document.getElementById("das").placeholder = "Can't leave empty";
            auth = false;
        }else if(!isValidEmail(email)){
            document.getElementById("das").placeholder = "Use a Valid Email";
            document.getElementById("das").value = "";
            auth = false;
        }
        if(message == ""){
            document.getElementById("message_input").placeholder = "Can't leave empty";
            auth = false;
        }
        if(subject == ""){
            const optionElement = document.querySelector('option[value=""]');
            optionElement.textContent = "You have to choose a subject";
            auth = false;
        }

        if(auth){
            fetch('/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nume: name,
                    telephone: phone.replace(/\D/g, ''),
                    gmail: email,
                    message: message,
                    subject: subject,
                }),
            })
            .then((response) => {
                if (response.status === 500) {
                    document.getElementById('form_button').value = "There was an error";
                }else if(response.status === 200){    
                    document.getElementById('form_button').value = "Email sent successfully";

                    const myPromise = new Promise((resolve) => {
                        setTimeout(() => {
                          resolve("Promise resolved after 2 seconds");
                        }, 3000);
                      });

                    myPromise.then(() => {
                        window.location.href = "./index.html";    
                        document.getElementById('form_button').value = "SEND MESSAGE";                    
                    }).catch((error) => {
                        console.error(error);
                    });
                    }
                })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    });
});

function isRomanianPhoneNumber(input) {
    const phoneNumber = input.replace(/\D/g, '');
    
    const romanianPhoneNumberRegex = /^(4)?(02|03|07|08)\d{8}$/;
    
    return romanianPhoneNumberRegex.test(phoneNumber);
  }
  
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(email);
  }