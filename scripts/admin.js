let listOfClients = document.getElementById("listClients");
let generateReports = document.getElementById("generateReports");

listOfClients.addEventListener('click', function (event) {
    window.location.href = '../html/listOfClients.html';
});

generateReports.addEventListener('click', function (event) {
    window.location.href = '../html/generateReports.html';
});

document.getElementById('adminLogout').addEventListener('click', function (event) {
    window.location.href = '../html/landingPage.html';
});

document.getElementById('error').addEventListener('click', function (event) {
    window.location.href = '../html/error404.html';
});

document.getElementById('documentation').addEventListener('click', function (event) {
    window.location.href = '../Documentatie/Documentatie.html';
});