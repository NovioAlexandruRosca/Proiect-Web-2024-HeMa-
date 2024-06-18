document.getElementById('downloadClientsCsv').addEventListener('click', function() {
    initiateDownload('/admin/api/clients/csv');
});

document.getElementById('downloadClientsPdf').addEventListener('click', function() {
    initiateDownload('/admin/api/clients/pdf');
});

document.getElementById('downloadPlantsCsv').addEventListener('click', function() {
    initiateDownload('/admin/api/plants/csv');
});

document.getElementById('downloadPlantsPdf').addEventListener('click', function() {
    initiateDownload('/admin/api/plants/pdf');
});

function initiateDownload(url) {
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    link.setAttribute('download', '');       
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
