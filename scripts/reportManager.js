document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:5500/admin/api/bans')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch ban reports');
            }
            return response.json();
        })
        .then(data => {
            console.log('Ban reports data:', data);
            populateReports(data);
        })
        .catch(error => {
            console.error('Error fetching ban reports:', error.message);
        });

    function populateReports(reports) {
        const reportsContainer = document.querySelector('.facts-section');

        reports.forEach(report => {
            const reportElement = createReportElement(report);
            reportsContainer.appendChild(reportElement);
        });
    }

    function createReportElement(report) {
        const apiBox = document.createElement('div');
        apiBox.classList.add('api-box');
        apiBox.setAttribute('data-report-id', report.id);

        const titleButton = document.createElement('button');
        titleButton.classList.add('api-box-title');
        titleButton.textContent = `${report.reportedBy}(Client ID: ${report.clientId}) Reported for (${report.motif})`;

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('api-box-content');
        contentDiv.setAttribute('data-report-id', report.id);

        contentDiv.innerHTML = `
            <p><strong>Client ID:</strong> ${report.clientId}</p>
            <p><strong>Reported Username:</strong> ${report.reportedUserName}</p>
            <p><strong>Reported Comment:</strong> ${report.reportedUserComment}</p>
            <p><strong>Reason:</strong> ${report.motif}</p>
        `;

        const banButton = document.createElement('button');
        banButton.classList.add('ban-button');
        banButton.textContent = 'Ban User';
        banButton.addEventListener('click', () => handleBanUser(report.clientId, report.motif, apiBox));

        const rejectButton = document.createElement('button');
        rejectButton.classList.add('reject-button');
        rejectButton.textContent = 'Reject Report';
        rejectButton.addEventListener('click', () => handleRejectReport(report.id, apiBox));

        contentDiv.appendChild(banButton);
        contentDiv.appendChild(rejectButton);

        apiBox.appendChild(titleButton);
        apiBox.appendChild(contentDiv);

        titleButton.addEventListener('click', () => {
            contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
        });

        return apiBox;
    }

    function handleBanUser(clientId, motif, reportElement) {
        fetch('http://localhost:5500/admin/api/banUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId, motif })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to ban user');
            }
            return response.json();
        })
        .then(data => {
            reportElement.remove();
        })
        .catch(error => {
            console.error('Error banning user:', error.message);
        });
    }

    function handleRejectReport(reportId, reportElement) {
        fetch('http://localhost:5500/admin/api/rejectReport', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reportId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to reject report');
            }
            return response.json();
        })
        .then(data => {
            reportElement.remove();
        })
        .catch(error => {
            console.error('Error rejecting report:', error.message);
        });
    }
});
