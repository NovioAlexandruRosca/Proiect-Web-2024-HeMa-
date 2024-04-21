let listOfClients = document.getElementById("listClients");
let generateReports = document.getElementById("generateReports");

listOfClients.addEventListener('click', function (event) {
    window.location.href = './listOfClients.html';
});

generateReports.addEventListener('click', function (event) {
    window.location.href = './generateReports.html';
});

document.getElementById('error').addEventListener('click', function (event) {
    window.location.href = './error404.html';
});

document.getElementById('documentation').addEventListener('click', function (event) {
    window.location.href = '../Documentatie/Documentatie.html';
});

document.getElementById('adminLogout').addEventListener("click", function(event){
    
    event.preventDefault();

    fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
    })
    .then(response => {
        if (response.ok) {
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = './landingPage.html';
        } else {
            console.error('Logout failed:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
});