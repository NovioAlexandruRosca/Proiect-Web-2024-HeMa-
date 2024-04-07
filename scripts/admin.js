let listOfClients = document.getElementById("listClients");
let generateReports = document.getElementById("generateReports");

listOfClients.addEventListener('click', function (event) {
    window.location.href = '/html/listOfClients.html';
});

generateReports.addEventListener('click', function (event) {
    window.location.href = '/html/generateReports.html';
});
