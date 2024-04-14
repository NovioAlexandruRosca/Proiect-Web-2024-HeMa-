function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomEmail() {
    return generateRandomString(8) + '@example.com';
}

function generateRandomTableRows(numRows) {
    const table = document.getElementById('clientsTableBody');

    for (let i = 1; i < numRows; i++) {
        const id = i + 1;
        const name = generateRandomString(10) + ' ' + generateRandomString(10);
        const email = generateRandomEmail();
        const row = document.createElement('tr');
        row.innerHTML = `
            <th><span class="idcol">${id}</span></th>
            <th class="scrollable-content"><span>${name}</span></th>
            <th><span>${email}</span></th>
            <th class="deleteBtn"><span class="emoji">🗑️</span></th>
            <th><span class="emoji">🌱</span></th>
        `;
        table.appendChild(row);
    }
}

generateRandomTableRows(20);

const deleteButtons = document.querySelectorAll('.deleteBtn');
deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
        const row = button.closest('tr');
        row.remove();
    });
});


const hiddenRow = document.getElementById('hidden');
hiddenRow.style.display = 'none';

const textInput = document.getElementById('textInput');
const tableRows = document.querySelectorAll('#clientsTableBody tr');

textInput.addEventListener('input', function(event) {
    const inputText = event.target.value.trim().toLowerCase();

    let numberOfFound = 0;
    let count = 0;

    tableRows.forEach(row => {
        count++;
        if(count > 1){
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
    if (numberOfFound == 0) {
        hiddenRow.style.display = '';
    } else {
        hiddenRow.style.display = 'none';
    }

});