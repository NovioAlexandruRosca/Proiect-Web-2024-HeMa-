function downloadReport(endpoint, filename) {
    fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading report:', error);
        });
}

document.querySelector('#clientsReportDiv .button:nth-child(1)').addEventListener('click', () => {
    downloadReport('/admin/api/reports/clients/csv', 'clients_report.csv');
});

document.querySelector('#clientsReportDiv .button:nth-child(2)').addEventListener('click', () => {
    downloadReport('/admin/api/reports/clients/pdf', 'clients_report.pdf');
});

document.querySelector('#plantsReportDiv .button:nth-child(1)').addEventListener('click', () => {
    downloadReport('/admin/api/reports/plants/csv', 'plants_report.csv');
});

document.querySelector('#plantsReportDiv .button:nth-child(2)').addEventListener('click', () => {
    downloadReport('/admin/api/reports/plants/pdf', 'plants_report.pdf');
});


// document.addEventListener('DOMContentLoaded', init);

// function init() {
//     document.querySelector('#clientsReportDiv .button:nth-child(1)').addEventListener('click', () => {
//         downloadReport('/admin/api/reports/clients/csv', 'clients_report.csv');
//     });

//     document.querySelector('#clientsReportDiv .button:nth-child(2)').addEventListener('click', () => {
//         downloadReport('/admin/api/reports/clients/pdf', 'clients_report.pdf');
//     });

//     document.querySelector('#plantsReportDiv .button:nth-child(1)').addEventListener('click', () => {
//         downloadReport('/admin/api/reports/plants/csv', 'plants_report.csv');
//     });

//     document.querySelector('#plantsReportDiv .button:nth-child(2)').addEventListener('click', () => {
//         downloadReport('/admin/api/reports/plants/pdf', 'plants_report.pdf');
//     });
// }

// function downloadReport(url, filename) {
//     fetch(url)
//         .then(response => response.blob())
//         .then(blob => {
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.style.display = 'none';
//             a.href = url;
//             a.download = filename;
//             document.body.appendChild(a);
//             a.click();
//             window.URL.revokeObjectURL(url);
//         })
//         .catch(error => {
//             console.error('Error downloading report:', error);
//         });
// }


