// // Funcție pentru a obține lista de clienți
// function fetchClients() {
//     fetch('/api/clients')
//         .then(response => response.json())
//         .then(data => displayClients(data))
//         .catch(error => console.error('Error fetching clients:', error));
// }

// // Funcție pentru a afișa clienții într-un tabel HTML
// function displayClients(clients) {
//     const table = document.getElementById('clientsTable');
//     clients.forEach(client => {
//         let row = table.insertRow();
//         let cell1 = row.insertCell(0);
//         let cell2 = row.insertCell(1);
//         let cell3 = row.insertCell(2);
//         cell1.innerHTML = client.id;
//         cell2.innerHTML = client.name;
//         cell3.innerHTML = client.email;
//     });
// }

// document.addEventListener('DOMContentLoaded', fetchClients);

// // Funcție pentru ștergerea unui client
// function deleteClient(clientId) {
//     fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
//         .then(response => {
//             if (response.ok) {
//                 console.log('Client deleted successfully');
//                 fetchClients(); // Reîmprospătează lista de clienți
//             }
//         })
//         .catch(error => console.error('Error deleting client:', error));
// }

// // Adăugare listeneri pentru butoanele de ștergere
// document.querySelectorAll('.delete-button').forEach(button => {
//     button.addEventListener('click', () => {
//         const clientId = button.getAttribute('data-client-id');
//         deleteClient(clientId);
//     });
// });

