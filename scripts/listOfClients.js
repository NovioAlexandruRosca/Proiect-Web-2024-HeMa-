document.addEventListener('DOMContentLoaded', init);

function init() {
    fetchClients()
        .then(clients => {
            clearTable();
            populateTable(clients);
            addDeleteEventListeners();
            addSearchEventListener();
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
        });
}

async function fetchClients() {
    const response = await fetch('/admin/api/clients');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

function clearTable() {
    const table = document.getElementById('clientsTableBody');
    table.innerHTML = '';
}

function populateTable(clients) {
    const table = document.getElementById('clientsTableBody');
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <th><span class="idcol">${client.id}</span></th>
            <th class="scrollable-content"><span>${client.name}</span></th>
            <th><span>${client.email}</span></th>
            <th class="deleteBtn"><span class="emoji">🗑️</span></th>
            <th><span class="emoji">🌱</span></th>
        `;
        table.appendChild(row);
    });
    addDeleteEventListeners();
}

function addDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll('.deleteBtn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

function handleDelete(event) {
    const row = event.currentTarget.closest('tr');
    const id = row.querySelector('.idcol').textContent;

    fetch(`/admin/api/clients/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            row.remove();
        } else {
            console.error('Error deleting client');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function addSearchEventListener() {
    const textInput = document.getElementById('textInput');
    textInput.addEventListener('input', handleSearch);
}

function handleSearch(event) {
    const inputText = event.target.value.trim().toLowerCase();
    const tableRows = document.querySelectorAll('#clientsTableBody tr');
    let numberOfFound = 0;
    let count = 0;

    tableRows.forEach(row => {
        count++;
        if (count > 1) {
            const emailCell = row.querySelector('th:nth-child(3) span');
            const email = emailCell.textContent.trim().toLowerCase();

            if (email.includes(inputText)) {
                row.style.display = '';
                numberOfFound++;
            } else {
                row.style.display = 'none';
            }
        }
    });

    const hiddenRow = document.getElementById('hidden');
    if (numberOfFound === 0) {
        hiddenRow.style.display = '';
    } else {
        hiddenRow.style.display = 'none';
    }
}


// const deleteButtons = document.querySelectorAll('.deleteBtn');
// deleteButtons.forEach(button => {
//     button.addEventListener('click', () => {
//         const row = button.closest('tr');
//         row.remove();
//     });
// });


// const hiddenRow = document.getElementById('hidden');
// hiddenRow.style.display = 'none';

// const textInput = document.getElementById('textInput');
// const tableRows = document.querySelectorAll('#clientsTableBody tr');

// textInput.addEventListener('input', function(event) {
//     const inputText = event.target.value.trim().toLowerCase();

//     let numberOfFound = 0;
//     let count = 0;

//     tableRows.forEach(row => {
//         count++;
//         if(count > 1){
//             const emailCell = row.querySelector('th:nth-child(3) span');
//             const email = emailCell.textContent.trim().toLowerCase();
            
//             if (email.includes(inputText)) {
//                 row.style.display = '';
//                 numberOfFound++;
//             } else {
//                 row.style.display = 'none';
//             }
//         }
//     });

//     const hiddenRow = document.getElementById('hidden');
//     if (numberOfFound == 0) {
//         hiddenRow.style.display = '';
//     } else {
//         hiddenRow.style.display = 'none';
//     }

// });