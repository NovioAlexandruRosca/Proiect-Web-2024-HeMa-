let listOfClients = document.getElementById("listClients");
let generateReports = document.getElementById("generateReports");

listOfClients.addEventListener('click', function (event) {
    window.location.href = './listOfClients.html';
});

generateReports.addEventListener('click', function (event) {
    window.location.href = './generateReports.html';
});

document.getElementById('adminLogout').addEventListener('click', function (event) {
    window.location.href = './landingPage.html';
});

document.getElementById('error').addEventListener('click', function (event) {
    window.location.href = './error404.html';
});

document.getElementById('documentation').addEventListener('click', function (event) {
    window.location.href = '../Documentatie/Documentatie.html';
});