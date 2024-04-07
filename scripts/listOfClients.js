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
    const table = document.getElementById('clientsTable');

    console.log(table);

    for (let i = 0; i < numRows; i++) {
        const id = i + 1;
        const name = generateRandomString(10) + ' ' + generateRandomString(10);
        const email = generateRandomEmail();
        const row = document.createElement('tr');
        row.innerHTML = `
            <th><h2 class="idcol">${id}</h2></th>
            <th class="scrollable-content"><h2>${name}</h2></th>
            <th><h2>${email}</h2></th>
            <th><h2 class="emoji">🗑️</h2></th>
            <th><h2 class="emoji">🌱</h2></th>
        `;
        table.appendChild(row);
    }
}

generateRandomTableRows(50);